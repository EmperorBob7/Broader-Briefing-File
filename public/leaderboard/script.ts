import { $id } from "../utils.js";

document.addEventListener('DOMContentLoaded', async () => {
    let leaderboardData = await (await fetch("/stockLeaderboard")).json();
    const table = $id("leaderboardTable");
    leaderboardData = leaderboardData.sort((a: any, b: any) => {
        return b.portfolio - a.portfolio;
    });
    console.table(leaderboardData);

    const prevBalance = leaderboardData[0].portfolio;
    let rank = 1;

    for (let i = 0; i < leaderboardData.length; i++) {
        const entry = leaderboardData[i];
        if (entry.portfolio != prevBalance) {
            rank = i + 1;
        }

        const tr = document.createElement("tr");

        const rankTD = document.createElement("td");
        rankTD.innerText = String(rank);

        const nameTD = document.createElement("td");
        nameTD.innerText = entry.name;

        const valueTD = document.createElement("td");
        valueTD.innerText = `$${entry.portfolio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        tr.appendChild(rankTD);
        tr.appendChild(nameTD);
        tr.appendChild(valueTD);
        table.appendChild(tr);
    }
});