import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';

import { jwtCheck, isAnyArgUndefined, reqHasBody, STARTING_BALANCE } from './auth.js';
import { StockMarket } from './schemas/stockMarket.js';
import { User } from './schemas/user.js';
import { Admin, IAdmin } from './schemas/admin.js';
import { getStockMarketStocksInOrder } from './stocks.js';

export const router = express.Router();
let adminInfo: IAdmin; // Initialize in index.ts

router.use(cookieParser());
router.use(jwtCheck, adminCheckMiddleware);
router.use(express.static("admin"));

router.get("/test", (req, res) => {
    res.json({ msg: adminInfo });
});

router.get("/adminPanel", async (req, res) => {
    await loadAdmin();
    return res.json({ canBuyStocks: adminInfo.canBuyStocks });
});

router.get("/turnOffStocks", async (req, res) => {
    adminInfo.canBuyStocks = false;
    await adminInfo.save();
    return res.json({ msg: "Success!" });
});

router.get("/turnOnStocks", async (req, res) => {
    adminInfo.canBuyStocks = true;
    await adminInfo.save();
    return res.json({ msg: "Success!" });
});

router.post("/updateStocks", reqHasBody, async (req, res) => {
    if (isAnyArgUndefined(req.body, ["stockValues"])) {
        return res.status(401).json({ msg: "Missing Field" });
    }
    const stockValues: number[] = req.body.stockValues;
    if (stockValues.length != (await numberOfStocks())) {
        return res.status(403).json({ msg: "Incorrect number of stocks!" });
    }
    // Put old values into array, load in new values
    const stocks = await getStockMarketStocksInOrder();
    for (let i = 0; i < stocks.length; i++) {
        const currentStock = stocks[i];
        currentStock.stockValues.push(currentStock.stockValue);
        currentStock.stockValue += stockValues[i]; // Relative Update
        await currentStock.save();
    }

    return res.json({ msg: "Success" });
});

router.get("/resetStocks", async (req, res) => {
    await StockMarket.updateMany({}, { ownCount: 0 });
    await User.updateMany({}, { balance: STARTING_BALANCE, stocks: new Array(12).fill(0) });
    return res.json({ msg: "Success" });
});

router.get("/setStocks", async (req, res) => {
    const stocks = await getStockMarketStocksInOrder();
    const stockData = [
        [
            50,
            50,
            50,
            58,
            58,
            55,
            55,
            55,
            55,
            55,
            55,
            58,
            60,
            60,
            60,
            60,
            60,
            61,
            63,
            66,
            69,
            69,
            70,
            70,
            70,
            70,
            72,
            77,
            79,
            79,
            79,
            85,
            85,
            85,
            85,
            92,
            97
        ],
        [
            50,
            50,
            50,
            60,
            60,
            65,
            65,
            65,
            65,
            65,
            65,
            60,
            62,
            65,
            65,
            65,
            65,
            63,
            63,
            63,
            63,
            63,
            63,
            63,
            65,
            65,
            66,
            68,
            70,
            70,
            72,
            72,
            72,
            71,
            74,
            74,
            73
        ],
        [
            50,
            50,
            50,
            60,
            60,
            65,
            65,
            65,
            65,
            65,
            65,
            65,
            64,
            64,
            61,
            61,
            62,
            59,
            59,
            62,
            62,
            62,
            62,
            64,
            64,
            64,
            63,
            63,
            58,
            63,
            69,
            75,
            75,
            72,
            72,
            72,
            79
        ],
        [
            50,
            50,
            50,
            70,
            70,
            70,
            70,
            70,
            70,
            70,
            70,
            68,
            67,
            67,
            67,
            67,
            67,
            63,
            61,
            61,
            61,
            61,
            61,
            66,
            68,
            68,
            71,
            74,
            78,
            78,
            80,
            80,
            80,
            84,
            84,
            84,
            87
        ],
        [
            50,
            50,
            50,
            62,
            62,
            62,
            62,
            62,
            62,
            62,
            62,
            62,
            60,
            60,
            60,
            61,
            61,
            63,
            63,
            66,
            66,
            66,
            66,
            66,
            63,
            63,
            62,
            62,
            63,
            63,
            67,
            72,
            72,
            74,
            74,
            74,
            70
        ],
        [
            50,
            50,
            50,
            73,
            70,
            80,
            80,
            80,
            80,
            80,
            80,
            80,
            84,
            86,
            88,
            88,
            88,
            89,
            91,
            92,
            94,
            94,
            94,
            97,
            94,
            94,
            96,
            99,
            103,
            103,
            105,
            105,
            105,
            102,
            102,
            102,
            102
        ],
        [
            50,
            50,
            40,
            54,
            54,
            59,
            59,
            59,
            59,
            49,
            44,
            47,
            50,
            55,
            55,
            58,
            62,
            58,
            59,
            64,
            68,
            68,
            75,
            72,
            80,
            85,
            89,
            91,
            98,
            98,
            100,
            100,
            102,
            102,
            107,
            108,
            114
        ],
        [
            50,
            50,
            50,
            64,
            64,
            64,
            64,
            64,
            59,
            59,
            59,
            59,
            57,
            57,
            58,
            58,
            58,
            68,
            68,
            73,
            73,
            73,
            73,
            73,
            71,
            61,
            58,
            62,
            55,
            68,
            74,
            74,
            74,
            78,
            78,
            78,
            83
        ],
        [
            50,
            50,
            50,
            71,
            71,
            84,
            84,
            84,
            84,
            99,
            99,
            101,
            102,
            102,
            102,
            97,
            98,
            99,
            99,
            99,
            97,
            115,
            115,
            115,
            115,
            112,
            106,
            108,
            107,
            107,
            107,
            110,
            110,
            110,
            110,
            108,
            111
        ],
        [
            50,
            50,
            50,
            66,
            66,
            66,
            66,
            66,
            66,
            66,
            66,
            64,
            63,
            68,
            68,
            68,
            68,
            68,
            68,
            70,
            70,
            70,
            70,
            70,
            67,
            67,
            67,
            65,
            64,
            64,
            66,
            66,
            66,
            66,
            66,
            69,
            74
        ],
        [
            50,
            50,
            50,
            56,
            60,
            70,
            70,
            70,
            70,
            70,
            70,
            70,
            69,
            69,
            69,
            69,
            66,
            61,
            57,
            57,
            57,
            57,
            57,
            62,
            62,
            62,
            57,
            57,
            56,
            56,
            56,
            56,
            61,
            72,
            69,
            72,
            76
        ],
        [
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            150,
            150,
            150,
            150,
            150,
            150,
            150
        ]
    ];
    for (let i = 0; i < stocks.length; i++) {
        const stock = stocks[i];
        const lastValue = stockData[i].pop() as number;
        stock.stockValues = stockData[i];
        stock.stockValue = lastValue;
        // stock.stockValues = [];
        await stock.save();
    }
    res.json({ msg: "Success" });
});

function getRandomData(numPoints: number): number[] {
    const data: number[] = [];
    for (let i = 0; i < numPoints; i++) {
        data.push(Math.floor(Math.random() * 101));
    }
    return data;
}

export function adminCheckMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.user;
    console.log(`${req.path}`, token);
    if (token) {
        if (token.name === "EmperorBob") {
            return next();
        }
        return res.status(401).json({ msg: "Unauthorized Access" });
    }
    return res.status(400).json({ msg: "Missing Token" });
}

export function canBuyStocks(): boolean {
    if (adminInfo == null) {
        return false;
    }
    return adminInfo.canBuyStocks;
}

export async function loadAdmin() {
    const admin = await Admin.findOne({});
    if (admin == null) {
        throw new Error("Can't load Admin");
    }
    adminInfo = admin;
}

async function numberOfStocks(): Promise<number> {
    const stocks = await StockMarket.countDocuments({});
    return stocks;
}