"use strict";
import { CharacterData } from "../character/character.js";
import { SquadRankings } from "../character/rankings.js";
import { $id } from "../utils.js";

document.addEventListener('DOMContentLoaded', () => {
    loadDom();
});

const searchInput = $id("searchInput") as HTMLInputElement;
document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "f") {
        // Ctrl + F
        e.preventDefault();
        searchInput.focus();
    }
});
searchInput.addEventListener("input", () => {
    loadDom(searchInput.value.toLowerCase());
});

function loadDom(filter = "") {
    console.log(filter);
    const container = $id("cardContainer") as HTMLElement;
    // Delete all Children
    while (container.firstChild) {
        container.removeChild(container.lastChild as Node);
    }
    let prevSquad = null;
    for (let i = 0; i < CharacterData.length; i++) {
        const character = CharacterData[i];
        if (!character.Name.toLowerCase().includes(filter) && !character.Squad.toLowerCase().includes(filter)) {
            if (prevSquad == null || character.Squad != prevSquad) {
                prevSquad = character.Squad;
                const breakEl = document.createElement("div");
                breakEl.classList.add("break");
                container.appendChild(breakEl);
            }
            continue;
        }
        const a = document.createElement("a");
        a.setAttribute("href", `/character?id=${i}`);
        const card = document.createElement("char-card");
        card.classList.add("btn");

        const p = document.createElement("p");
        p.classList.add("name");
        p.innerText = character["Name (Western)"];

        card.appendChild(p);
        a.appendChild(card);
        // Break Line
        if (prevSquad == null || character.Squad != prevSquad) {
            prevSquad = character.Squad;

            const breakEl = document.createElement("div");
            breakEl.classList.add("break");
            container.appendChild(breakEl);
        }
        // Styling
        container.appendChild(a);
        card.style.backgroundColor = SquadRankings[character.Squad].color;
        card.style.color = "#000";
    }
}