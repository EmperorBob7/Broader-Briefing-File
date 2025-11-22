import * as Globals from "../main.js";
import { $id, $idInput } from "../utils.js";
Globals.loginListeners.push(loadIndividualData);
Globals.loginListeners.push(loadBalance);

enum StockAction {
    Buy = "buy",
    Sell = "sell"
};

interface StockData {
    stockID: number;
    stockValue: number;
    stockValues: number[];
    stockName: string;
    stockLabel: string;
    ownCount: number;
}

// Chart.JS Start
interface Dataset {
    label: string;
    data: number[];
    fill: boolean;
    borderColor: string;
    tensions: number;
}

interface ChartData {
    labels: string[];
    datasets: Dataset[];
}

const datasets: Dataset[] = [];
const originalDatasets: number[][] = []; // Stock Values for Chart.js
const labels: string[] = [];           // Labels for Chart.js
// Chart.JS End

let stockData: StockData[];
let chart: Chart;
const stockCounts: number[] = []; // Number of stocks owned by User
let stockValues: number[] = [];   // Stock values for Stock Listing UI

document.addEventListener('DOMContentLoaded', async () => {
    const latestChapter = 207 + (await (await fetch("/numChaps")).json()).count;
    const chapterCount = latestChapter - 207 + 1;
    for (let i = 207; i <= latestChapter; i++) {
        labels.push(i.toString());
    }

    // Load /stockData
    await loadDataSet();
    setInterval(async () => {
        await loadStockValues(false);
    }, 5_000);

    // Create Chart
    const data: ChartData = {
        labels: labels,
        datasets: datasets
    };
    createChart(data);

    // Chart Slider
    const sliderMin = $id("minRange") as HTMLInputElement;
    sliderMin.oninput = updateChart;
    const startingSlider = latestChapter - 6;
    sliderMin.value = String(startingSlider);
    sliderMin.max = String(latestChapter - 1);
    ($id("minRangeDisplay") as HTMLElement).innerText = String(startingSlider);
    updateChart();

    // Buying/Selling Slider
    const buySellCount = $idInput("buyCount");
    buySellCount.oninput = () => { updateSliderDisplay(buySellCount, "buySellDisplay") };

    $id("hideAllStocks").addEventListener("click", hideAllStocks);
    $id("showAllStocks").addEventListener("click", showAllStocks);
    $id("toggleOwnedStocks").addEventListener("click", toggleOwnedStocks);
    $id("toggleUnownedStocks").addEventListener("click", toggleUnownedStocks);
});

function createChart(data: ChartData) {
    const canvas = $id("barGraph") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    canvas.height = window.innerHeight * 0.8;

    const config = {
        type: 'line',
        data: data,
        options: {
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        color: 'white' // X-axis tick labels color
                    },
                    grid: {
                        color: 'white' // X-axis grid color
                    }
                },
                y: {
                    ticks: {
                        color: 'white'
                    },
                    grid: {
                        color: 'white'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    },
                    onHover: handleHover,
                    onLeave: handleLeave
                }
            }
        }
    };
    chart = new Chart(ctx, config as any);
}

function updateSliderDisplay(original: HTMLInputElement, id: string) {
    $id(id).innerText = original.value;
}

/**
 * Load all of the values for Stocks.
 * Can be done without signing in.
 * Calls loadIndividualData() afterwards but may not happen if not signed in!
 */
async function loadDataSet() {
    const response = await fetch("/stockData");
    const json = await response.json();
    stockData = json;
    const borderColors = [
        "rgba(180,140,228, 1.0)", // Utagawa
        "rgba(175, 248, 251, 1.0)", // Oji
        "rgba(255, 151, 50, 1.0)", // Kakizaki
        "rgba(54, 162, 255, 1.0)", // Kitazoe
        "rgba(255, 206, 86, 1.0)", // Kuruma
        "rgba(153, 102, 255, 1.0)", // Kodera
        "rgba(141, 224, 151, 1.0)", // Suwa
        "rgba(20, 192, 220, 1.0)", // Ninomiya
        "rgba(255, 50, 71, 1.0)", // Mizukami
        "rgba(10, 255, 149, 1.0)", // Murakami
        "rgba(238, 49, 215, 1.0)", // Wakamura
        "rgba(255, 255, 255, 1.0)" // Brian
    ];

    for (let i = 0; i < json.length; i++) {
        const stock = json[i];
        const obj = {
            label: stock.stockName,
            data: stock.stockValues as number[],
            fill: false,
            borderColor: borderColors[i],
            tensions: 0.1
        };
        obj.data.push(stock.stockValue);

        datasets.push(obj);
        originalDatasets.push(obj.data.slice(0)); // Clone Data
        stockCounts.push(0);
    }
    loadIndividualData();
}

function updateChart() {
    const sliderMin = $idInput("minRange");
    const minValue = parseInt(sliderMin.value) - 207;
    const trimmedLabels = labels.slice(minValue);
    for (let i = 0; i < datasets.length; i++) {
        datasets[i].data = originalDatasets[i].slice(minValue);
    }
    chart.data.labels = trimmedLabels;
    chart.update();
    updateSliderDisplay(sliderMin, "minRangeDisplay");
}

// From Chart.JS

// Append '4d' to the colors (alpha channel), except for the hovered index
function handleHover(evt: any, item: any) {
    datasets.forEach((data) => {
        if (data.label != item.text) {
            data.borderColor = data.borderColor.replace("1.0", "0.0");
        }
    });
    chart.update();
}

// Removes the alpha channel from background colors
function handleLeave() {
    datasets.forEach((data) => {
        data.borderColor = data.borderColor.replace("0.0", "1.0");
    });
    chart.update();
}

function hideAllStocks() {
    datasets.forEach((data, i) => {
        chart.setDatasetVisibility(i, false);
    });
    chart.update();
}

function showAllStocks() {
    datasets.forEach((data, i) => {
        chart.setDatasetVisibility(i, true);
    });
    chart.update();
}

let ownedVisibility = true;
function toggleOwnedStocks() {
    ownedVisibility = !ownedVisibility;
    stockCounts.forEach((count, i) => {
        if (count != 0) {
            chart.setDatasetVisibility(i, ownedVisibility);
        }
    });
    chart.update();
}

let unownedVisibility = true;
function toggleUnownedStocks() {
    unownedVisibility = !unownedVisibility;
    stockCounts.forEach((count, i) => {
        if (count == 0) {
            chart.setDatasetVisibility(i, unownedVisibility);
        }
    });
    chart.update();
}

async function loadIndividualData() {
    if (!Globals.isLoggedIn() || stockData == undefined) {
        return;
    }
    for (let i = 0; i < stockCounts.length; i++) {
        // In case logging out and logging into someone else
        stockCounts[i] = 0;
    }
    const res = await fetch("/stocks/getAll");
    const stockArr = await res.json();
    console.log(stockArr);
    stockArr.forEach((stockCount: number, i: number) => {
        stockCounts[i] = stockCount;
    });

    await loadStockValues(true);
}

/* Stock Stuff */

/**
 * Get stock data from /stockValues and put them in the UI
 * @param create True if to setup UI, False if to just update
 */
async function loadStockValues(create: boolean = false) {
    if (!Globals.isLoggedIn() || stockData == undefined) {
        return;
    }

    const res = await fetch("/stockValues");
    stockValues = (await res.json()).values;

    if (create) {
        loadStocks();
    } else {
        updateStocks();
    }
}

/**
 * Generates the table of stocks to buy/sell
 * Should be done after Logging In
 * @returns Nothing
 */
function loadStocks() {
    if (!Globals.isLoggedIn() || stockData == undefined) {
        return;
    }
    const stockContainer = $id("stockContainer");
    // Delete all old UI in case of re-login
    while (stockContainer.firstChild) {
        stockContainer.removeChild(stockContainer.firstChild);
    }
    // Create UI
    stockData.forEach((stock, i) => {
        stockContainer.appendChild(createStockElement(stock, i))
    });
}

/**
 * Updates existing UI for Stock Listings
 */
function updateStocks() {
    const stockContainer = $id("stockContainer");
    if (!Globals.isLoggedIn() || stockData == undefined || stockContainer.children.length < stockData.length) {
        return;
    }
    for (let i = 0; i < stockData.length; i++) {
        const stockOption = stockContainer.querySelector(`#stock${i}`) as HTMLElement;
        const stockValue = stockOption.querySelector("#stockValue") as HTMLElement;
        stockValue.innerText = `Value: $${stockValues[i]}`
    }
}

async function loadBalance() {
    if (!Globals.isLoggedIn()) {
        return;
    }
    const res = await fetch("/stocks/getBalance");
    if (res.status != 200) {
        console.error(res);
        return Globals.makeToast("Error loading Balance.", "info-error", 3);
    }
    const json = await res.json();
    setBalance(json.balance);
}

function setBalance(balance: number) {
    const balanceText = $id("balanceText");
    balanceText.innerText = balance.toLocaleString();
}

function createStockElement(stock: StockData, stockNumber: number) {
    const stockOption = document.createElement("stock-option");
    stockOption.id = `stock${stockNumber}`;

    const p = document.createElement("p");
    p.id = "stockName";
    p.innerText = stock.stockName;
    const span = document.createElement("span");
    span.innerText = ` (${stock.stockLabel})`;
    p.appendChild(span);

    const buyButton = document.createElement("button");
    buyButton.classList.add("btn", "btn-info", "join-item");
    buyButton.innerText = "Buy";
    buyButton.addEventListener("click", () => { tradeStock(stockNumber, StockAction.Buy) });

    const sellButton = document.createElement("button");
    sellButton.classList.add("btn", "btn-error", "join-item");
    sellButton.innerText = "Sell";
    sellButton.addEventListener("click", () => { tradeStock(stockNumber, StockAction.Sell) });

    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("join");
    buttonContainer.appendChild(buyButton);
    buttonContainer.appendChild(sellButton);

    const stockCount = document.createElement("p");
    stockCount.id = "stockCount";
    stockCount.innerText = `Stock: ${stockCounts[stockNumber]}`;

    const stockValue = document.createElement("p");
    stockValue.id = "stockValue";
    stockValue.innerText = `Value: $${stockValues[stockNumber]}`;


    stockOption.appendChild(p);
    stockOption.appendChild(stockCount);
    stockOption.appendChild(stockValue);
    stockOption.appendChild(buttonContainer);
    return stockOption;
}

async function tradeStock(stockNumber: number, action: StockAction) {
    const count = parseInt($idInput("buyCount").value, 10);

    const data: Record<string, any> =
        action === StockAction.Buy
            ? { stockID: stockNumber, buyCount: count }
            : { stockID: stockNumber, sellCount: count };

    const res = await fetch(`/stocks/${action}Stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    const json = await res.json();

    const stockCountEl = document
        .querySelector(`#stock${stockNumber}`)!
        .querySelector("#stockCount") as HTMLElement;

    if (res.status === 200) {
        // Update local stockCounts
        stockCounts[stockNumber] += action === "buy" ? count : -count;

        Globals.makeToast(`${json.msg}`, "alert-success", 2);
        setBalance(json.balance);
        stockCountEl.innerText = `Stock: ${stockCounts[stockNumber].toLocaleString()}`;
        loadStockValues();
    } else {
        Globals.makeToast(`${json.msg}`, "alert-error", 2);
    }
}
