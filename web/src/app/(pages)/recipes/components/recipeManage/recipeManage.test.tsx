import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hideRecipesAction } from "@/actions/hide";
import { restoreRecipesAction } from "@/actions/restore";
import { ManageBanner } from "./manageBanner";
import { ManageItem } from "./manageItem";
import { ManageToggle } from "./manageToggle";
import { type ManageMode, RecipeManageProvider } from "./recipeManage";

// 画面の移動と保存は本物を動かさず、呼ばれたかだけを確かめる
const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/actions/hide", () => ({ hideRecipesAction: vi.fn() }));
vi.mock("@/actions/restore", () => ({ restoreRecipesAction: vi.fn() }));

const RECIPES = [
  { id: "a", title: "鯖の味噌煮" },
  { id: "b", title: "麻婆豆腐" },
];

/** 整理のボタン・お知らせ・レシピ2件を、ページと同じように Provider の中に並べて描く */
const renderManage = (mode: ManageMode = "hide") =>
  render(
    <RecipeManageProvider mode={mode}>
      <ManageToggle />
      <ManageBanner />
      {RECIPES.map((recipe) => (
        <ManageItem
          key={recipe.id}
          recipeId={recipe.id}
          title={recipe.title}
          layout="card"
        >
          <p>{recipe.title}</p>
        </ManageItem>
      ))}
      <a href="/">トップへ</a>
      <a href="/recipes?page=2">2ページ目へ</a>
    </RecipeManageProvider>,
  );

/** 「レシピを整理する」のボタン */
const toggleButton = () =>
  screen.getByRole("button", { name: "レシピを整理する" });

beforeEach(() => {
  // 整理しているページの URL にしておく
  window.history.replaceState(null, "", "/recipes?meal=lunch&page=3");
  // jsdom はスクロールを持たないので、何もしない関数にしておく
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  vi.mocked(hideRecipesAction).mockResolvedValue({ type: "saved" });
  vi.mocked(restoreRecipesAction).mockResolvedValue({ type: "saved" });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("整理を始める・やめる", () => {
  it("押すと整理中になり、お知らせと各レシピの「削除」が出る", async () => {
    const user = userEvent.setup();
    renderManage();
    expect(screen.queryByText(/整理中/)).not.toBeInTheDocument();

    await user.click(toggleButton());

    expect(toggleButton()).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/整理中：削除予定 0件/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "「鯖の味噌煮」を削除予定にする" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "非表示中のレシピ" }),
    ).toHaveAttribute("href", "/recipes/hidden");
  });

  it("予定がなければ、もう一度押すとそのまま整理をやめる", async () => {
    const user = userEvent.setup();
    renderManage();

    await user.click(toggleButton());
    await user.click(toggleButton());

    expect(toggleButton()).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});

describe("予定にする・取り消す", () => {
  it("押すと予定になり件数が増え、もう一度押すと取り消せる", async () => {
    const user = userEvent.setup();
    renderManage();
    await user.click(toggleButton());

    await user.click(
      screen.getByRole("button", { name: "「鯖の味噌煮」を削除予定にする" }),
    );

    expect(screen.getByText(/削除予定 1件/)).toBeInTheDocument();
    const cancel = screen.getByRole("button", {
      name: "「鯖の味噌煮」の削除を取り消す",
    });
    expect(cancel).toHaveTextContent("取り消す");

    await user.click(cancel);

    expect(screen.getByText(/削除予定 0件/)).toBeInTheDocument();
  });
});

describe("完了", () => {
  it("予定をまとめて保存し、絞り込みを残したまま1ページ目へ移る", async () => {
    const user = userEvent.setup();
    renderManage();
    await user.click(toggleButton());
    await user.click(
      screen.getByRole("button", { name: "「鯖の味噌煮」を削除予定にする" }),
    );
    await user.click(
      screen.getByRole("button", { name: "「麻婆豆腐」を削除予定にする" }),
    );

    await user.click(screen.getByRole("button", { name: "完了" }));

    expect(hideRecipesAction).toHaveBeenCalledWith(["a", "b"]);
    expect(replace).toHaveBeenCalledWith("/recipes?meal=lunch", {
      scroll: false,
    });
    expect(toggleButton()).toHaveAttribute("aria-pressed", "false");
  });

  it("予定がなければ保存せずに整理をやめる", async () => {
    const user = userEvent.setup();
    renderManage();
    await user.click(toggleButton());

    await user.click(screen.getByRole("button", { name: "完了" }));

    expect(hideRecipesAction).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(toggleButton()).toHaveAttribute("aria-pressed", "false");
  });

  it("保存に失敗したら、予定を残したままお知らせを出す", async () => {
    vi.mocked(hideRecipesAction).mockResolvedValue({ type: "error" });
    const user = userEvent.setup();
    renderManage();
    await user.click(toggleButton());
    await user.click(
      screen.getByRole("button", { name: "「鯖の味噌煮」を削除予定にする" }),
    );

    await user.click(screen.getByRole("button", { name: "完了" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "削除できませんでした",
    );
    expect(screen.getByText(/削除予定 1件/)).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("非表示レシピのページでは「一覧に戻す」で予定にし、一覧へ戻す処理で保存する", async () => {
    window.history.replaceState(null, "", "/recipes/hidden");
    const user = userEvent.setup();
    renderManage("restore");
    await user.click(toggleButton());

    expect(
      screen.queryByRole("link", { name: "非表示中のレシピ" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: "「麻婆豆腐」をレシピ一覧に戻す予定にする",
      }),
    );
    await user.click(screen.getByRole("button", { name: "完了" }));

    expect(restoreRecipesAction).toHaveBeenCalledWith(["b"]);
    expect(hideRecipesAction).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/recipes/hidden", { scroll: false });
  });
});

describe("予定を残したまま整理をやめるときの確認", () => {
  /** 整理を始めて1件を予定にし、もう一度「レシピを整理する」を押して確認を出す */
  const openLeaveDialog = async () => {
    const user = userEvent.setup();
    renderManage();
    await user.click(toggleButton());
    await user.click(
      screen.getByRole("button", { name: "「鯖の味噌煮」を削除予定にする" }),
    );
    await user.click(toggleButton());
    return user;
  };

  it("「整理を続ける」なら予定を残す", async () => {
    const user = await openLeaveDialog();
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent(
      "削除予定の 1件は、まだ削除されていません",
    );

    await user.click(
      within(dialog).getByRole("button", { name: "整理を続ける" }),
    );

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByText(/削除予定 1件/)).toBeInTheDocument();
  });

  it("「変更を取り消して戻る」なら予定を消して整理をやめる", async () => {
    const user = await openLeaveDialog();

    await user.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "変更を取り消して戻る",
      }),
    );

    expect(toggleButton()).toHaveAttribute("aria-pressed", "false");
    expect(hideRecipesAction).not.toHaveBeenCalled();
  });
});

describe("予定を残したままページを離れるときの確認", () => {
  /** 整理を始めて1件を予定にする */
  const addPending = async () => {
    const user = userEvent.setup();
    renderManage();
    await user.click(toggleButton());
    await user.click(
      screen.getByRole("button", { name: "「鯖の味噌煮」を削除予定にする" }),
    );
  };

  /**
   * リンクを左クリックしたときのイベントを送り、そのイベントを返す
   * 移動が止められたかは、返したイベントの defaultPrevented で分かる
   */
  const clickLink = (name: string) => {
    const link = screen.getByRole("link", { name });
    // 確認のあとに jsdom が本当にページを移ろうとしないよう、最後に受け取るリンク自身で止める
    link.addEventListener("click", (event) => event.preventDefault());
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
    });
    link.dispatchEvent(event);
    return event;
  };

  it("別のページへのリンクを押すと確認し、断ればその場にとどまる", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const onLinkClick = vi.fn();
    await addPending();
    screen
      .getByRole("link", { name: "トップへ" })
      .addEventListener("click", onLinkClick);

    clickLink("トップへ");

    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining("削除予定の 1件は、まだ削除されていません"),
    );
    // 断ったので、リンクまでイベントが届かない
    expect(onLinkClick).not.toHaveBeenCalled();
  });

  it("確認で「OK」を押せば、そのまま移る", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onLinkClick = vi.fn();
    await addPending();
    screen
      .getByRole("link", { name: "トップへ" })
      .addEventListener("click", onLinkClick);

    clickLink("トップへ");

    expect(onLinkClick).toHaveBeenCalled();
  });

  it("同じページの中の移動（ページ送り）は確認しない", async () => {
    const confirm = vi.spyOn(window, "confirm");
    await addPending();

    clickLink("2ページ目へ");

    expect(confirm).not.toHaveBeenCalled();
  });
});
