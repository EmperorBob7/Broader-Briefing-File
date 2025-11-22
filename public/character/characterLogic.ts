import { SquadRankings, Ranking, RankingSquad } from "./rankings.js";
import { CharacterData, Character } from "./character.js";
import { $id } from "../utils.js";
declare const Chart: any;

document.addEventListener('DOMContentLoaded', () => {
    // Get Character
    const currentURL = window.location.href;
    const url = new URL(currentURL);
    const queryParams = new URLSearchParams(url.search);
    const characterID = queryParams.get("id");
    const characterData: Character = CharacterData[Number(characterID || "0")];
    // Emblem
    $id("emblem").addEventListener("load", (): void => {
        const emblemElement: HTMLObjectElement | null = document.querySelector("#emblem");
        if (emblemElement) {
            const contentDocument = emblemElement.contentDocument;
            if (contentDocument) {
                const squadRanking: Ranking = (SquadRankings as RankingSquad)[characterData.Squad];
                contentDocument.querySelector("#RankABC")!.textContent = squadRanking.rank;
                contentDocument.querySelector("#RankText")!.textContent = squadRanking.position;
                if (squadRanking.rank == "B") {
                    (contentDocument.querySelector("#RankText") as HTMLElement)!.style.fontSize = "7.9";
                }
                (contentDocument.querySelector("#RankFill") as HTMLElement)!.style.fill = squadRanking.color;
                contentDocument.querySelector("#image1")!.setAttribute("href", squadRanking.emblem);
            }
        }
    });
    // Name + Other Text
    $id("characterName").innerText = characterData["Name (Western)"];
    $id("position").innerText = `POSITION: ${characterData.Position.toUpperCase() || "UNKNOWN"}`;
    $id("age").innerText = `AGE: ${characterData.Age || "?"} YEARS OLD`;
    $id("birthday").innerText = `BIRTHDAY: ${convertDateToString(characterData.BirthMonth, characterData.BirthDay) || "UNKNOWN"}`;
    $id("height").innerText = `HEIGHT: ${characterData.Height || "UNKNOWN "}CM`;
    $id("bloodType").innerText = `BLOOD TYPE: ${characterData.BloodType || "UNKNOWN"}`;
    $id("zodiac").innerText = `ZODIAC: THE ${characterData.Zodiac.toUpperCase() || "UNKNOWN"}`;
    // $id("occupation").innerText = `OCCUPATION: ` + characterData.Occupation; // TODO
    // $id("likes").innerText = `LIKES: ` + characterData.Likes; // TODO
    displayTriggers(characterData);
    
    // Radar Chart
    $id("totalNumber").innerText = String(Number(characterData.Trion) + Number(characterData.Attack) + Number(characterData.DefenceSupport) + Number(characterData.Mobility) + Number(characterData.Skill) + Number(characterData.Range) + Number(characterData.Command) + Number(characterData.SpecialTactics));
    
    const radarChart = $id("radarChart") as HTMLCanvasElement;
    const ctx = radarChart.getContext("2d");
    const data = {
        labels: [
            ['TRION', `${characterData.Trion}`],
            ['ATTACK', `${characterData.Attack}`.padStart(7, ' ')],
            ['DEFENSE', 'SUPPORT', `${characterData.DefenceSupport}`.padStart(8, ' ')],
            ['MOBILITY', `${characterData.Mobility}`.padStart(8, ' ')],
            ['SKILL', `${characterData.Skill}`],
            ['RANGE', `${characterData.Range}`.padEnd(6, ' ')],
            ['COMMAND', `${characterData.Command}`.padEnd(8, ' ')],
            ['SPECIAL', 'TACTICS', `${characterData.SpecialTactics}`.padEnd(8, ' ')]
        ],
        datasets: [{
            label: '',
            data: [
                `${characterData.Trion || 1}`,
                `${characterData.Attack}`,
                `${characterData.DefenceSupport}`,
                `${characterData.Mobility}`,
                `${characterData.Skill}`,
                `${characterData.Range}`,
                `${characterData.Command}`,
                `${characterData.SpecialTactics}`
            ],
            fill: true,
            backgroundColor: 'rgba(0,0,0, 0.5)',
            pointStyle: false,
            hoverRadius: 0,
            clip: {
                left: 5, top: -400, right: -200, bottom: 0
            }
        }]
    };
    new Chart(ctx, {
        type: 'radar',
        data: data,
        options: {
            layout: {
                padding: 10
            },
            events: [],
            elements: {
                line: {
                    borderWidth: 0
                }
            },
            scales: {
                r: {
                    min: 0,
                    max: 10,
                    ticks: {
                        stepSize: 2,
                        display: false
                    },
                    grid: {
                        lineWidth: 1.5,
                        color: "rgba(140, 140, 140, 1)"
                    },
                    angleLines: {
                        lineWidth: 1.5,
                        color: "rgba(140, 140, 140, 1)"
                    },
                    pointLabels: {
                        color: "#000",
                        font: {
                            size: 14,
                            weight: "bold"
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        },
    });
});

function displayTriggers(characterData: Character) {
    const mainTriggers = [characterData.Main1, characterData.Main2, characterData.Main3, characterData.Main4];
    const subTriggers = [characterData.Sub1, characterData.Sub2, characterData.Sub3, characterData.Sub4];
    for (let i = 1; i <= 4; i++) {
        if (mainTriggers[i - 1] === "") {
            $id(`mainTrigger${i}`).classList.add("freeTrigger");
        } else {
            $id(`mainTrigger${i}`).classList.remove("freeTrigger");
        }
        $id(`main${i}Image`).setAttribute("src", getTriggerImage(mainTriggers[i - 1]));
        $id(`main${i}Name`).innerText = mainTriggers[i - 1].toUpperCase().replace(":", ":\n") || "FREE TRIGGER";
        $id(`main${i}Type`).innerText = getTriggerType(mainTriggers[i - 1]);
        if (subTriggers[i - 1] === "") {
            $id(`subTrigger${i}`).classList.add("freeTrigger");
        } else {
            $id(`subTrigger${i}`).classList.remove("freeTrigger");
        }
        $id(`sub${i}Image`).setAttribute("src", getTriggerImage(subTriggers[i - 1]));
        $id(`sub${i}Name`).innerText = subTriggers[i - 1].toUpperCase().replace(":", ":\n") || "FREE TRIGGER";
        $id(`sub${i}Type`).innerText = getTriggerType(subTriggers[i - 1]);
    }
}

function getTriggerImage(triggerName: string): string {
    interface ImageMap {
        [key: string]: string;
    }
    const triggerImageMap: ImageMap = {
        "Opt": "../images/triggers/opt.png",
        "Shield": "../images/triggers/shi.png",
        "Switchbox": "../images/triggers/switchbox.png",
        "Free": "../images/triggers/free.png",
        // Sniper
        "Egret": "../images/triggers/egret.png",
        "Ibis": "../images/triggers/ibis.png",
        "Lightning": "../images/triggers/light.png",
        // Gunner
        "handgun": "../images/triggers/handgun.png",
        "grenade launcher": "../images/triggers/grenade.png",
        "shotgun": "../images/triggers/shot.png",
        "assault rifle": "../images/triggers/arifle.png",
        // Shooter
        "Asteroid": "../images/triggers/aster.png",
        "Hound": "../images/triggers/hound.png",
        "Meteor": "../images/triggers/mete.png",
        "Viper": "../images/triggers/viper.png",
        // Attacker
        "Kogetsu": "../images/triggers/kog.png",
        "Raygust": "../images/triggers/ray.png",
        "Scorpion": "../images/triggers/sco.png",
        "spear": "../images/triggers/speark.png",
        "Sogetsu": "../images/triggers/soget.png"
    };
    if (triggerName === "") {
        return triggerImageMap.Free;
    }
    for (const currentTrigger in triggerImageMap) {
        if (triggerName.includes(currentTrigger)) {
            return triggerImageMap[currentTrigger];
        }
    }
    return triggerImageMap.Opt;
}

function getTriggerType(triggerName: string): string {
    interface TypeMap {
        [key: string]: string;
    }
    const triggerTypeMap: TypeMap = {
        "Opt": "OPTION TRIGGER",
        "Shield": "DEFENSE TRIGGER",
        "Switchbox": "TRAPPER TRIGGER",
        "Free": "FREE TRIGGER",
        // Sniper
        "Egret": "SNIPER TRIGGER",
        "Ibis": "SNIPER TRIGGER",
        "Lightning": "SNIPER TRIGGER",
        // Gunner
        "handgun": "GUNNER TRIGGER",
        "grenade launcher": "GUNNER TRIGGER",
        "shotgun": "GUNNER TRIGGER",
        "assault rifle": "GUNNER TRIGGER",
        // Shooter
        "Asteroid": "SHOOTER TRIGGER",
        "Hound": "SHOOTER TRIGGER",
        "Meteor": "SHOOTER TRIGGER",
        "Viper": "SHOOTER TRIGGER",
        // Attacker
        "Kogetsu": "ATTACKER TRIGGER",
        "Raygust": "ATTACKER TRIGGER",
        "Scorpion": "ATTACKER TRIGGER",
        "spear": "ATTACKER TRIGGER",
        "Sogetsu": "ATTACKER TRIGGER"
    };
    if (triggerName === "") {
        return triggerTypeMap.Free;
    }
    for (const currentTrigger in triggerTypeMap) {
        if (triggerName.includes(currentTrigger)) {
            return triggerTypeMap[currentTrigger];
        }
    }
    return triggerTypeMap.Opt;
}

function convertDateToString(month: string | number, day: string | number): string {
    if (month === "" || day === "") {
        return "";
    }
    const months = [
        "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ];
    const monthNum: number = Number(month);
    const dayNum: number = Number(day);

    const monthName = months[monthNum - 1];
    const ordinalSuffix = getOrdinalSuffix(dayNum);
    return `${monthName} ${day}${ordinalSuffix}`;
}

function getOrdinalSuffix(day: number): string {
    if (day > 3 && day < 21) return "TH";
    switch (day % 10) {
        case 1: return "ST";
        case 2: return "ND";
        case 3: return "RD";
        default: return "TH";
    }
}