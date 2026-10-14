import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom は <dialog> の showModal と close をまだ持たないので、開閉の状態だけを再現する
// ブラウザと違い、close イベントはすぐに届き、autoFocus のボタンへフォーカスも移さない
// そのため「開いたときに Enter で変更が消えない」ことは、このテストでは確かめられない
if (typeof HTMLDialogElement.prototype.showModal !== "function") {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}

// テストごとに描画した部品を片付け、次のテストに持ち越さない
afterEach(() => {
  cleanup();
});
