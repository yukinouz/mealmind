import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LeaveDialog } from "./leaveDialog";

// 画面の移動は本物を動かさず、呼ばれたかだけを確かめる
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

/** ダイアログと、ページの中のリンクを並べて描く */
const renderPage = (isDirty: boolean) =>
  render(
    <>
      <LeaveDialog isDirty={isDirty} />
      <a href="/settings/suggest">提案のしかた</a>
      <a href="/">
        {/* biome-ignore lint/performance/noImgElement: ヘッダーのロゴの代わり。テストでは next/image の最適化はいらない */}
        <img src="/logo.svg" alt="MealMind" />
      </a>
      <a href="/settings/channels">チャンネル</a>
      <a href="https://www.youtube.com/@ryuji825">@ryuji825</a>
    </>,
  );

/** 確認のダイアログ。閉じているときは読み上げの対象外なので、hidden も含めて探す */
const dialog = () => screen.getByRole("alertdialog", { hidden: true });

/** リンクを押す。jsdom は画面を移らないので、押したときに止められたか（defaultPrevented）を返す */
const clickLink = (name: string): boolean => {
  const link = screen.getByRole("link", { name });
  return !fireEvent.click(link);
};

beforeEach(() => {
  // いまのページを、チャンネルの設定にしておく
  window.history.replaceState(null, "", "/settings/channels");
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("未保存の変更がないとき", () => {
  it("リンクを押しても止めず、ダイアログも出ない", () => {
    renderPage(false);

    expect(clickLink("提案のしかた")).toBe(false);
    expect(dialog()).not.toHaveAttribute("open");
  });
});

describe("未保存の変更があるとき", () => {
  it("別のページへのリンクを押すと止めて、行き先の名前を添えたダイアログを出す", () => {
    renderPage(true);

    expect(clickLink("提案のしかた")).toBe(true);
    expect(dialog()).toHaveAttribute("open");
    expect(dialog()).toHaveTextContent(
      "このまま「提案のしかた」に移ると、このページの変更は取り消されます。",
    );
  });

  it("文字のないリンク（ロゴ）は、画像の代わりの文字を名前にする", () => {
    renderPage(true);

    clickLink("MealMind");

    expect(dialog()).toHaveTextContent("「MealMind」に移ると");
  });

  it("「保存せずに移る」で行き先へ移る", async () => {
    const user = userEvent.setup();
    renderPage(true);
    clickLink("提案のしかた");

    await user.click(screen.getByRole("button", { name: "保存せずに移る" }));

    expect(push).toHaveBeenCalledWith("/settings/suggest");
  });

  it("「このページに残る」でダイアログを閉じ、移らない", async () => {
    const user = userEvent.setup();
    renderPage(true);
    clickLink("提案のしかた");

    await user.click(screen.getByRole("button", { name: "このページに残る" }));

    expect(dialog()).not.toHaveAttribute("open");
    expect(push).not.toHaveBeenCalled();
  });

  it("いまのページと、サイトの外へのリンクは止めない", () => {
    renderPage(true);

    expect(clickLink("チャンネル")).toBe(false);
    expect(clickLink("@ryuji825")).toBe(false);
    expect(dialog()).not.toHaveAttribute("open");
  });

  it("新しいタブで開く押し方（⌘ を押しながら）は止めない", () => {
    renderPage(true);
    const link = screen.getByRole("link", { name: "提案のしかた" });

    expect(fireEvent.click(link, { metaKey: true })).toBe(true);
    expect(dialog()).not.toHaveAttribute("open");
  });

  it("タブを閉じる・再読み込みするときは、ブラウザの確認を出す", () => {
    renderPage(true);
    const event = new Event("beforeunload", { cancelable: true });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});
