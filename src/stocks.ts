import express from 'express';
import queue from 'express-queue';
import cookieParser from 'cookie-parser';
import { jwtCheck, reqHasBody, isAnyArgUndefined, JwtPayload } from "./auth.js";
import { User } from './schemas/user.js';
import { IStockMarket, StockMarket } from './schemas/stockMarket.js';
import { canBuyStocks } from './admin.js';
import { userCount } from './index.js';

export const router = express.Router();

router.use(cookieParser());
router.use(jwtCheck);
router.use(queue({ activeLimit: 1, queuedLimit: -1 }));

router.get("/", (req, res) => {
    res.json({ msg: "Stock Route" });
});

router.get("/getAll", async (req, res) => {
    const token: JwtPayload = req.user as JwtPayload;
    const outputStocks = (await User.findById(token.userID))?.stocks || [];
    return res.json(outputStocks);
});

router.get("/getBalance", async (req, res) => {
    const token: JwtPayload = req.user as JwtPayload;

    return res.json({ msg: "Success", balance: (await User.findById(token.userID))?.balance });
});

router.post("/buyStock", reqHasBody, async (req, res) => {
    if (!canBuyStocks()) {
        return res.status(400).json({ msg: "Buy/Sell is disabled currently." });
    }
    if (isAnyArgUndefined(req.body, ["stockID", "buyCount"])) {
        return res.status(401).json({ msg: "Missing Field" });
    }

    const stockID: number = req.body.stockID;
    const buyCount: number = req.body.buyCount;
    const token: JwtPayload = req.user as JwtPayload;
    // More Safety Checks
    if (typeof (stockID) !== 'number' || typeof (buyCount) !== 'number') {
        return res.status(401).json({ msg: "Broken Field" });
    }
    if (stockID < 0 || stockID > 11 || buyCount <= 0) {
        return res.status(401).json({ msg: "Invalid Field" });
    }
    // Get Stock
    const stockData = await StockMarket.findOne({ stockID: stockID });
    if (stockData == null) {
        return res.status(403).json({ msg: "Stock Not Found?" });
    }
    // Get User
    const userTemp = await User.findOne({ name: token.name });
    if (userTemp == null) {
        return res.status(403).json({ msg: "Something went wrong!" });
    }
    // Perform Safe Buying
    // const playerAdjustmentValue = await getPlayerAdjustmentValue();
    let costOfPurchase = 0;
    for (let i = 0; i < buyCount; i++) {
        const stockVal = await getStockAdjustedValue(stockData.stockValue, stockData.ownCount + i);
        costOfPurchase += stockVal;
    }
    // Ensure User has enough Funds
    if (userTemp.balance < costOfPurchase) {
        return res.status(401).json({ msg: `Not enough Funds, need: ${costOfPurchase}` });
    }
    // Safe to buy now
    stockData.ownCount += buyCount;
    userTemp.balance -= costOfPurchase;
    userTemp.stocks[stockID] += buyCount;
    // Save Changes
    stockData.save();
    userTemp.save();

    return res.json({ msg: `Success.`, balance: userTemp.balance });
});

router.post("/sellStock", reqHasBody, async (req, res) => {
    if (!canBuyStocks()) {
        return res.status(400).json({ msg: "Buy/Sell is disabled currently." });
    }
    if (isAnyArgUndefined(req.body, ["stockID", "sellCount"])) {
        return res.status(401).json({ msg: "Missing Field" });
    }

    const stockID: number = req.body.stockID;
    const sellCount: number = req.body.sellCount;
    const token: JwtPayload = req.user as JwtPayload;
    // More Safety Checks
    if (typeof (stockID) !== 'number' || typeof (sellCount) !== 'number') {
        return res.status(401).json({ msg: "Broken Field" });
    }
    if (stockID < 0 || stockID > 11 || sellCount <= 0) {
        return res.status(401).json({ msg: "Invalid Field" });
    }
    // Get Stock
    const stockData = await StockMarket.findOne({ stockID: stockID });
    if (stockData == null) {
        return res.status(403).json({ msg: "Stock Not Found?" });
    }
    // Get User
    const userTemp = await User.findOne({ name: token.name });
    if (userTemp == null) {
        return res.status(403).json({ msg: "Something went wrong!" });
    }
    // Stocks owned for this ID only
    if (userTemp.stocks[stockID] < sellCount) {
        return res.status(403).json({ msg: "You don't own enough stocks to sell this many!" });
    }
    // Perform Safe Selling
    // const playerAdjustmentValue = await getPlayerAdjustmentValue();
    for (let i = 0; i < sellCount; i++) {
        const stockVal = await getStockAdjustedValue(stockData.stockValue, stockData.ownCount - 1);
        // Safe to buy now
        stockData.ownCount--;
        userTemp.balance += stockVal - 1; // -1 to avoid new user inflation
        userTemp.stocks[stockID]--;
    }
    // Save Changes
    stockData.save();
    userTemp.save();

    return res.json({ msg: `Success.`, balance: userTemp?.balance });
});

// async function getStockMarketValue(): Promise<number> {
//     const stocks = await StockMarket.find({});
//     const playerCount = await User.countDocuments();
//     const availableStocks = playerCount * 10;
//     let stockValue = 1; // Avoid divide by 0 issues
//     for (let i = 0; i < stocks.length; i++) {
//         stockValue += stocks[i].ownCount * stocks[i].stockValue;
//     }
//     return stockValue;
// }

// export async function getPlayerAdjustmentValue(): Promise<number> {
//     // Anti Inflation
//     const result = await User.aggregate([
//         {
//             $group: {
//                 _id: null, // Group by null to get the sum of all documents
//                 totalBalance: { $sum: '$balance' },
//             },
//         },
//     ]);
//     const expectedPlayerBalance = result.length > 0 ? result[0].totalBalance : 0;
//     const marketValue = await getStockMarketValue();
//     const playerAdjustmentValue = (expectedPlayerBalance + marketValue) / marketValue;
//     // console.log("Adjustment: ", playerAdjustmentValue);
//     // console.log("Market: ", marketValue);
//     return playerAdjustmentValue;
// }

/**
 * Calculates how much a stock is actually worth based on the own count.
 * @param baseValue 
 * @param ownCount 
 */
export async function getStockAdjustedValue(baseValue: number, ownCount: number/*, playerAdjustmentValue?: number*/): Promise<number> {
    // if (playerAdjustmentValue == undefined) {
    //     // playerAdjustmentValue = await getPlayerAdjustmentValue();
    // }

    const OWN_JUMP = 15; // Number of owns to change value
    const JUMP_MULTIPLIER = 1.5; // Number to change by per JUMP

    // const floatValue = Math.max(baseValue + JUMP_MULTIPLIER * Math.floor(ownCount / OWN_JUMP) - playerAdjustmentValue, 1.5);
    const floatValue = baseValue + JUMP_MULTIPLIER * Math.floor(ownCount / OWN_JUMP) - userCount / 100;
    return Math.round(floatValue * 100) / 100;
}

export async function getStockMarketStocksInOrder(): Promise<IStockMarket[]> {
    return await StockMarket.find({}).sort({ stockID: 1 });
}