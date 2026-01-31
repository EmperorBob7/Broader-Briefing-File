let canBuyStocks = false;

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById("stockBox").addEventListener("click", () => { toggleStocks(true); });
    document.getElementById("stockSubmitButton").addEventListener("click", () => { updateStocks(); });

    await loadAdminData();
});

async function updateStocks() {
    const data = [];
    const NUM_STOCKS = 20;
    for (let i = 0; i < NUM_STOCKS; i++) {
        data.push(parseInt(document.getElementById(`stock${i}Input`).value || "0"));
    }
    
    const response = await fetch('/admin/updateStocks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            stockValues: data
        })
    });

    const json = await response.json();
    makeToast(json.msg, "alert-warning", 3);
}

async function loadAdminData() {
    const res = await fetch("/admin/adminPanel");
    const json = await res.json();
    canBuyStocks = json.canBuyStocks;
    toggleStocks(false);
    makeToast(JSON.stringify(json), "alert-success", 2);
}

/**
 * Updates UI and Switches Toggle unless toggle is false
 * @param {boolean} toggle true if you want to switch the value, false if not 
 */
async function toggleStocks(toggle) {
    const stockBox = document.getElementById("stockBox");
    console.log("toggle", toggle, "canBuy", canBuyStocks);
    console.log((toggle && canBuyStocks) || (!toggle && !canBuyStocks));
    if ((toggle && canBuyStocks) || (!toggle && !canBuyStocks)) {
        // Turn Off
        if (toggle) {
            await fetch("/admin/turnOffStocks");
        }
        console.log("Fetched");
        stockBox.classList.remove("btn-success");
        stockBox.classList.add("btn-error");
        stockBox.innerText = "DISABLED";
    } else {
        // Turn On
        if (toggle) {
            await fetch("/admin/turnOnStocks");
        }
        stockBox.classList.remove("btn-error");
        stockBox.classList.add("btn-success");
        stockBox.innerText = "ENABLED";
    }
    if (toggle) {
        canBuyStocks = !canBuyStocks;
    }
}

/**
 * 
 * @param {string} msg The message for the toast 
 * @param {string} alertClass Color for toast, alert-info, alert-success, etc 
 * @param {number} timeSeconds Time to display in Seconds 
 */
export function makeToast(msg, alertClass, timeSeconds) {
    const toastContainer = document.getElementById("globalToastContainer");
    const div = document.createElement("div");
    div.classList.add("alert", alertClass);
    const span = document.createElement("span");
    span.innerText = msg;

    div.appendChild(span);
    toastContainer.appendChild(div);
    setTimeout(() => {
        toastContainer.removeChild(div);
    }, timeSeconds * 1000);
}