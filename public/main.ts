import { $id, $idDialog, $idInput } from "./utils";

let userID: string;
let userName: string;

// Push functions to be called after logging in is detected!
export const loginListeners: (() => Promise<void>)[] = [];

declare interface TokenJSON {
  msg: {
    name: string;
    userID: string;
  };
}

document.addEventListener('DOMContentLoaded', () => {
    getJWT();
    $id("modalLoginButton").addEventListener("click", login);
    $id("modalRegisterButton").addEventListener("click", register);
    accountRuleInputs();
});

function accountRuleInputs() {
    const usernameLogin = $idInput("usernameInput");
    const usernameRegister = $idInput("usernameInputRegister");
    usernameLogin.addEventListener("input", () => { usernameRules("loginRule1", usernameLogin) });
    usernameRegister.addEventListener("input", () => { usernameRules("registerRule1", usernameRegister) });

    const passwordLogin = $idInput("passwordInput");
    const passwordRegister = $idInput("passwordInputRegister");
    passwordLogin.addEventListener("input", () => { passwordRules("loginRule2", passwordLogin) });
    passwordRegister.addEventListener("input", () => { passwordRules("registerRule2", passwordRegister) });

    function usernameRules(id: string, inputElement: HTMLInputElement) {
        const loginRule1 = $id(id);
        loginRule1.className = "";
        if (inputElement.value.length >= 3 && inputElement.value.length <= 20) {
            loginRule1.classList.add("text-success");
        } else {
            loginRule1.classList.add("text-error");
        }
    }

    function passwordRules(id: string, inputElement: HTMLInputElement) {
        const loginRule2 = $id(id);
        loginRule2.className = "";
        if (inputElement.value.length >= 6 && inputElement.value.length <= 30) {
            loginRule2.classList.add("text-success");
        } else {
            loginRule2.classList.add("text-error");
        }
    }
}

async function getJWT() {
    const data = await fetch("/auth/cookie");
    const tokenJSON: TokenJSON = await data.json();
    const loggedInArea = $id("loggedInArea");

    if (data.status == 200) {
        // Success
        loggedInDropdown(tokenJSON);
        if (loggedInArea) {
            loggedInArea.classList.remove("blockedArea");
        }
        loggedIn = true;
        console.log("Logged In", loginListeners);
        loginListeners.forEach(async f => {
            await f();
        });
    } else {
        loggedOutDropdown();
        if (loggedInArea) {
            loggedInArea.classList.add("blockedArea");
        }
        loggedIn = false;
    }
}

export function isLoggedIn(): boolean {
    return loggedIn;
}

function loggedOutDropdown() {
    const list = $id("profileDropdownList");
    list.innerHTML = ``;

    const loginLI = document.createElement("li");
    const loginA = document.createElement("a");
    loginA.id = "loginButton";
    loginA.innerText = `Login`;
    loginLI.appendChild(loginA);
    list.appendChild(loginLI);

    loginA.addEventListener("click", () => {
        $idDialog("loginModal").showModal();
    });

    const registerLI = document.createElement("li");
    const registerA = document.createElement("a");
    registerA.id = "registerButton";
    registerA.innerText = `Register`;
    registerLI.appendChild(registerA);
    list.appendChild(registerLI);

    registerA.addEventListener("click", () => {
        $idDialog("registerModal").showModal();
    });
}

function loggedInDropdown(tokenJSON: TokenJSON) {
    const list = $id("profileDropdownList");
    list.innerHTML = ``;

    userName = tokenJSON.msg.name;
    userID = tokenJSON.msg.userID;

    const nameLI = document.createElement("li");
    const nameA = document.createElement("a");
    nameA.innerText = `Logged in as ${tokenJSON.msg.name}`;
    nameLI.appendChild(nameA);
    list.appendChild(nameLI);

    const logoutLI = document.createElement("li");
    const logoutA = document.createElement("a");
    logoutA.id = "logoutButton";
    logoutA.innerText = `Logout`;
    logoutLI.appendChild(logoutA);
    list.appendChild(logoutLI);

    logoutA.addEventListener("click", logout);
}

async function login() {
    const loginButton = $id("modalLoginButton");
    loginButton.setAttribute("disabled", "true");
    const nameInput = $idInput("usernameInput");
    const passwordInput = $idInput("passwordInput");
    // Fetch
    const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: nameInput.value,
            password: passwordInput.value
        })
    });
    const data = await response.json();
    if (response.status == 200) {
        $id("modalCloseButton").click();
        makeToast(data.msg, "alert-success", 2);
        getJWT();
    } else {
        makeToast(data.msg, "alert-error", 2);
    }
    loginButton.removeAttribute("disabled");
}

async function register() {
    const registerButton = $id("modalRegisterButton");
    registerButton.setAttribute("disabled", "true");
    const nameInput = $idInput("usernameInputRegister");
    const passwordInput = $idInput("passwordInputRegister");
    // Fetch
    const response = await fetch("/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: nameInput.value,
            password: passwordInput.value
        })
    });
    const data = await response.json();
    if (response.status == 200) {
        $id("modalRegisterCloseButton").click();
        makeToast(data.msg, "alert-success", 2);
        makeToast("Attempting Login", "alert-warning", 2);

        const loginNameInput = $idInput("usernameInput");
        const loginPasswordInput = $idInput("passwordInput");
        loginNameInput.value = nameInput.value;
        loginPasswordInput.value = passwordInput.value;
        login();
    } else {
        makeToast(data.msg, "alert-error", 2);
    }
    registerButton.removeAttribute("disabled");
}

async function logout() {
    await fetch("/auth/logout");
    getJWT();
}

/**
 * @param msg The message for the toast 
 * @param alertClass Color for toast, alert-info, alert-success, etc 
 * @param timeSeconds Time to display in Seconds 
 */
export function makeToast(msg: string, alertClass: string, timeSeconds: number) {
    const toastContainer = $id("globalToastContainer");
    const div = document.createElement("div");
    div.classList.add("alert", "alert-outline", alertClass);
    const span = document.createElement("span");
    span.innerText = msg;

    div.appendChild(span);
    toastContainer.appendChild(div);
    setTimeout(() => {
        toastContainer.removeChild(div);
    }, timeSeconds * 1000);
}