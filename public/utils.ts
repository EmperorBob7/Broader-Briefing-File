export function $(query: string) {
    return document.querySelector(query) as HTMLElement;
}

export function $id(id: string) {
    return document.querySelector(id) as HTMLElement;
}

export function $idInput(id: string) {
    return document.querySelector(id) as HTMLInputElement;
}

export function $idDialog(id: string) {
    return document.querySelector(id) as HTMLDialogElement;
}

export function $$(query: string) {
    return document.querySelectorAll(query) as NodeListOf<HTMLElement>;
}
