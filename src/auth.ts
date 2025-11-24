import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import Filter from 'bad-words';

import { incrementUsers } from './index.js';
import { User } from './schemas/user.js';
import { NUM_STOCKS } from './stocks.js';

export const router = express.Router();
export interface JwtPayload {
    name: string;
    userID: string;
};
const SALT_ROUNDS = 10;
const badWordsFilter = new Filter();
export const STARTING_BALANCE = 1000;

router.use(cookieParser());

router.get("/", (req, res) => {
    res.json({ msg: "Auth Route" });
});

router.post("/register", reqHasBody, async (req, res) => {
    interface RegisterInput {
        name: string;
        password: string;
    }
    const inputs: RegisterInput = req.body;
    if (isAnyArgUndefined(inputs, ["name", "password"])) {
        return res.status(401).json({ msg: "Missing Field" });
    }
    const validNamePassword = registerNamePasswordCheck(inputs.name, inputs.password);
    if (validNamePassword.msg !== "") {
        return res.status(403).json(validNamePassword);
    }
    // Unique Username
    const nameAlreadyUsed = await User.findOne({ name: inputs.name });
    if (nameAlreadyUsed !== null) {
        return res.status(403).json({ msg: "Failed - Name Taken" });
    }
    // Valid Details, Create User
    const salt = bcrypt.genSaltSync(SALT_ROUNDS);
    const hashedPassword = bcrypt.hashSync(inputs.password, salt);
    await User.insertMany({
        name: inputs.name,
        password: hashedPassword,
        balance: STARTING_BALANCE,
        stocks: new Array(NUM_STOCKS).fill(0),
        // Phase One
        balancePhaseOne: 0,
        stocksPhaseOne: new Array(NUM_STOCKS).fill(0)
    });
    incrementUsers();
    return res.status(200).json({ msg: "Success" });
});

function registerNamePasswordCheck(name: string, password: string) {
    if (name.length < 3) {
        return { msg: "Name must be at least 3 characters!" };
    }
    if (name.length > 20) {
        return { msg: "Name must be less than or equal to 20 characters!" };
    }
    if (password.length < 6) {
        return { msg: "Password must be longer than 6 characters!" }
    }
    if (password.length > 30) {
        return { msg: "Password must be less than or equal to 30 characters!" }
    }
    if (badWordsFilter.isProfane(name)) {
        return { msg: `Username is Profane: ${badWordsFilter.clean(name)}` };
    }
    return { msg: "" };
}

router.post("/login", reqHasBody, async (req, res) => {
    interface LoginInput {
        name: string;
        password: string;
    }
    const inputs: LoginInput = req.body;
    if (isAnyArgUndefined(inputs, ["name", "password"])) {
        return res.status(401).json({ msg: "Missing Field" });
    }
    // Check if user is in DB
    const user = await User.findOne({ name: inputs.name });
    if (user == null) {
        return res.status(404).json({ msg: "No user with that name" });
    }
    // Password Check
    if (bcrypt.compareSync(inputs.password, user.password as string)) {
        const payload: JwtPayload = {
            userID: (user._id as mongoose.Types.ObjectId).toString(),
            name: user.name as string
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "7d" });
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
            secure: true
        });

        return res.status(200).json({ msg: "Success", token: token });
    }
    return res.status(401).json({ msg: "Incorrect Password" });
});

router.get("/logout", jwtCheck, (req, res) => {
    // const token = req.user;
    res.clearCookie("token");
    res.json({ msg: "Cleared Cookie" });
});

router.get("/cookie", jwtCheck, (req, res) => {
    const token = req.user;
    return res.json({ msg: token, token: req.cookies.token });
});

export async function connectToDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log("connected");
    } catch (e: any) {
        console.log(e.message);
    }
}

/**
 * Middleware to make sure the request has a body.
 * Useful for POST since they need a JSON Body.
 */
export function reqHasBody(req: Request, res: Response, next: NextFunction) {
    if (!req.body) {
        return res.status(400).json({ msg: "Missing Request Body" });
    }
    next();
}

/**
 * Must check if the returned value is null or not
 * @param token 
 * @returns Return the JwtPayload if valid otherwise null
 */
export function decodeJWT(token: string): JwtPayload | null {
    try {
        // Verify the JWT
        return jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    } catch (ex) {
        return null;
    }
}

/**
 * Middlware to make sure a JWT passed in is Valid
 * @param req 
 * @param res 
 * @param next 
 * @returns 
 */
export function jwtCheck(req: Request, res: Response, next: NextFunction) {
    const token: string | undefined = req.cookies.token;
    if (!token) {
        return res.status(401).json({ msg: 'Access denied. No token provided.' });
    }
    const jwtToken = decodeJWT(token);
    if (jwtToken === null) {
        return res.status(400).json({ msg: "Invalid Token" });
    }
    req.user = jwtToken;
    next();
}

/**
 * Check whether all arguments are defined in a given object (inputs)
 * @param inputs The object to search over
 * @param argList Required Arguments
 * @returns 
 */
export function isAnyArgUndefined(inputs: any, argList: string[]) {
    for (const arg of argList) {
        if (inputs[arg] === undefined) {
            return true;
        }
    }
    return false;
}