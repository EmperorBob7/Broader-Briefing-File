import { CronJob, sendAt } from 'cron';
import 'dotenv/config';
import express, { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit'
import { cacheSeconds } from 'route-cache';

import { router as AuthRoute, connectToDB } from './auth.js';
import { router as AdminRoute, loadAdmin } from './admin.js';
import { getStockAdjustedValue, getStockMarketStocksInOrder, router as StockRoute } from './stocks.js';
import { IStockMarket, StockMarket } from './schemas/stockMarket.js';
import { User } from './schemas/user.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const limiter = rateLimit({
    windowMs: 1 * 1000, // 1 second
    limit: 40,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { msg: "Rate Limited." }
});
export let userCount = 0;
export interface LeaderboardEntry {
    name: string;
    portfolio: number;
}

app.set('view engine', 'ejs');
app.use(limiter);
app.use(express.json({ limit: '1kb' }));
app.use(express.urlencoded({ extended: true }));
app.use("/auth", AuthRoute);
app.use("/admin", AdminRoute);
app.use("/stocks", StockRoute);

app.get('/', (req: Request, res: Response) => {
    res.render("pages/home", {
        auth: { loggedIn: true }
    });
});

app.get('/canon', (req: Request, res: Response) => {
    res.render("pages/canon", {
        auth: { loggedIn: true }
    });
});

app.get('/character', (req: Request, res: Response) => {
    res.render("pages/character", {
        auth: { loggedIn: true }
    });
});

app.get('/investing', (req: Request, res: Response) => {
    res.render("pages/investing", {
        auth: { loggedIn: true }
    });
});

app.get('/ocmaker', (req: Request, res: Response) => {
    res.render("pages/ocmaker", {
        auth: { loggedIn: true }
    });
});

app.get('/ocmaker2', (req: Request, res: Response) => {
    res.render("pages/ocmaker2", {
        auth: { loggedIn: true }
    });
});

app.get('/leaderboard', (req: Request, res: Response) => {
    res.render("pages/leaderboard", {
        auth: { loggedIn: true }
    });
});

app.use(express.static("public"));

app.get("/stockData", async (req, res) => {
    return res.json(await getStockMarketStocksInOrder());
});

app.get("/stockValues", cacheSeconds(20), async (req, res) => {
    const stocks = await getStockMarketStocksInOrder();
    const values: number[] = [];
    const ownCounts: number[] = [];
    for (let i = 0; i < stocks.length; i++) {
        const stock: IStockMarket = stocks[i];
        values.push(await getStockAdjustedValue(stock.stockValue, stock.ownCount));
        ownCounts.push(stock.ownCount);
    }
    return res.json({ values, ownCounts });
});

app.get("/stockLeaderboard", cacheSeconds(30), async (req, res) => {
    const users = await User.find({}, { name: 1, balance: 1, stocks: 1 });
    const stocks = await getStockMarketStocksInOrder();
    const stockValues = stocks.map(s => s.stockValue);

    const leaderboardArr = users.map(user => {
        // Dot-product user.stocks × stockValues
        const portfolioValue = user.stocks.reduce(
            (sum, count, idx) => sum + count * stockValues[idx],
            0
        );

        return {
            name: user.name,
            portfolio: user.balance + portfolioValue,
        };
    });

    res.json(leaderboardArr);
});

app.get("/numChaps", cacheSeconds(20), async (req, res) => {
    const stock = await StockMarket.findOne({});
    return res.json({ count: stock?.stockValues.length || 0 });
});

async function dailyIncome() {
    console.log("Daily!");
    await User.updateMany({}, { $inc: { balance: 100 } }); // $100 everyday!
}

const job = new CronJob(
    '0 0 * * *', // cronTime, midnight
    function () {
        dailyIncome();
    }, // onTick
    null, // onComplete
    true, // start
    'America/Los_Angeles' // timeZone
);

export function incrementUsers() {
    userCount++;
}

app.listen(PORT, '0.0.0.0', async () => {
    const dt = sendAt('0 0 * * *');
    console.log(`Daily at: ${dt.toISO()}`);
    await connectToDB();
    await loadAdmin();
    userCount = await User.countDocuments();
    console.log(`Server is running http://localhost:${PORT}`);
});