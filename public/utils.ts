export function $(query: string) {
    return document.querySelector(query) as HTMLElement;
}
(window as any).$ = $;

export function $id(id: string) {
    return document.getElementById(id) as HTMLElement;
}
(window as any).$id = $id;

export function $idInput(id: string) {
    return document.getElementById(id) as HTMLInputElement;
}
(window as any).$idInput = $idInput;

export function $idDialog(id: string) {
    return document.getElementById(id) as HTMLDialogElement;
}
(window as any).$idDialog = $idDialog;

export function $$(query: string) {
    return document.querySelectorAll(query) as NodeListOf<HTMLElement>;
}
(window as any).$$ = $$;
