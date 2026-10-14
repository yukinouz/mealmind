import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_FILTER,
  type RecipeFilter as Filter,
} from "@/utils/recipeFilter";
import { RecipeManageProvider } from "../recipeManage/recipeManage";
import { RecipeFilter } from "./recipeFilter";

// URL の書き換えは本物を動かさず、どの URL に書き換えようとしたかだけを確かめる
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/recipes",
}));
// 絞り込み欄の中の「レシピを整理する」が読み込むので、保存の処理は偽物にする
vi.mock("@/actions/hide", () => ({ hideRecipesAction: vi.fn() }));
vi.mock("@/actions/restore", () => ({ restoreRecipesAction: vi.fn() }));

const CHANNELS = [
  { id: "chef-a", label: "シェフA" },
  { id: "chef-b", label: "シェフB" },
];

/** 既定の条件に一部だけ上書きした条件 */
const filterOf = (overrides: Partial<Filter>): Filter => ({
  ...DEFAULT_FILTER,
  ...overrides,
});

/** ページと同じように、整理の Provider の中に絞り込み欄を描く */
const renderFilter = (filter: Filter = DEFAULT_FILTER) => {
  const ui = (next: Filter) => (
    <RecipeManageProvider mode="hide">
      <RecipeFilter filter={next} channels={CHANNELS} />
    </RecipeManageProvider>
  );
  const result = render(ui(filter));
  // サーバーから新しい条件が届いたときと同じように描き直す
  return { rerenderWith: (next: Filter) => result.rerender(ui(next)) };
};

/** 名前で選ぶボタン。「すべて」のように同じ名前が並ぶものは何番目かで選ぶ */
const button = (name: string, index = 0) =>
  screen.getAllByRole("button", { name })[index];

afterEach(() => {
  vi.clearAllMocks();
});

describe("絞り込みのボタン", () => {
  it("押すと、その条件を URL に入れて1ページ目に戻す", async () => {
    const user = userEvent.setup();
    renderFilter(filterOf({ page: 3 }));

    await user.click(button("昼食"));

    expect(replace).toHaveBeenCalledWith("/recipes?meal=lunch", {
      scroll: false,
    });
  });

  it("同じ項目の中は、押すたびに足したり外したりする", async () => {
    const user = userEvent.setup();
    renderFilter(filterOf({ cuisines: ["washoku"] }));

    await user.click(button("中華"));
    expect(replace).toHaveBeenLastCalledWith("/recipes?cuisine=washoku,chuka", {
      scroll: false,
    });

    await user.click(button("和食"));
    expect(replace).toHaveBeenLastCalledWith("/recipes", { scroll: false });
  });

  it("選んでいるものは押された見た目になる", () => {
    renderFilter(filterOf({ channels: ["chef-b"] }));

    expect(button("シェフB")).toHaveAttribute("aria-pressed", "true");
    expect(button("シェフA")).toHaveAttribute("aria-pressed", "false");
    // 食事は何も選んでいないので「すべて」が押されている
    expect(button("すべて", 0)).toHaveAttribute("aria-pressed", "true");
    expect(button("すべて", 2)).toHaveAttribute("aria-pressed", "false");
  });

  it("「すべて」がすでに押されていれば、押しても URL を書き換えない", async () => {
    const user = userEvent.setup();
    renderFilter(filterOf({ page: 2 }));

    await user.click(button("すべて", 0));

    expect(replace).not.toHaveBeenCalled();
  });
});

describe("条件をクリア", () => {
  it("絞り込み欄で何も選んでいなければ出さない", () => {
    renderFilter(filterOf({ isFavoriteOnly: true }));

    expect(
      screen.queryByRole("button", { name: "条件をクリア" }),
    ).not.toBeInTheDocument();
  });

  it("絞り込み欄の条件だけを外し、♡のみ・並び順は残す", async () => {
    const user = userEvent.setup();
    renderFilter(
      filterOf({
        meals: ["dinner"],
        channels: ["chef-a"],
        isFavoriteOnly: true,
        order: "oldest",
      }),
    );

    await user.click(button("条件をクリア"));

    expect(replace).toHaveBeenCalledWith("/recipes?fav=1&order=oldest", {
      scroll: false,
    });
  });
});

describe("♡のみ・並び順・表示形式", () => {
  it("♡のみと並び順は、変えると1ページ目に戻す", async () => {
    const user = userEvent.setup();
    renderFilter(filterOf({ page: 3 }));

    await user.click(button("お気に入りのみ"));
    expect(replace).toHaveBeenLastCalledWith("/recipes?fav=1", {
      scroll: false,
    });

    await user.click(button("追加日が新しい順（押すと古い順）"));
    expect(replace).toHaveBeenLastCalledWith("/recipes?order=oldest", {
      scroll: false,
    });
  });

  it("表示形式は、出るレシピが変わらないのでページをそのままにする", async () => {
    const user = userEvent.setup();
    renderFilter(filterOf({ page: 3 }));

    await user.click(button("リスト表示に切り替える"));

    expect(replace).toHaveBeenCalledWith("/recipes?view=list&page=3", {
      scroll: false,
    });
  });
});

describe("検索欄", () => {
  beforeEach(() => {
    // 打ち終わってからの待ち時間を、実際に待たずに進める
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** 検索欄 */
  const searchBox = () =>
    screen.getByRole("searchbox", { name: "レシピを検索" });

  it("打ち終わって少し待ってから、前後の空白を除いた言葉で検索する", () => {
    renderFilter(filterOf({ page: 2 }));

    fireEvent.change(searchBox(), { target: { value: " 鯖 " } });
    act(() => vi.advanceTimersByTime(299));
    expect(replace).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(replace).toHaveBeenCalledWith(
      `/recipes?q=${encodeURIComponent("鯖")}`,
      { scroll: false },
    );
  });

  it("日本語の変換中は検索せず、確定してから検索する", () => {
    renderFilter();

    fireEvent.compositionStart(searchBox());
    fireEvent.change(searchBox(), { target: { value: "さば" } });
    act(() => vi.advanceTimersByTime(1000));
    expect(replace).not.toHaveBeenCalled();

    fireEvent.compositionEnd(searchBox());
    fireEvent.change(searchBox(), { target: { value: "鯖" } });
    act(() => vi.advanceTimersByTime(300));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(
      `/recipes?q=${encodeURIComponent("鯖")}`,
      { scroll: false },
    );
  });

  it("URL の言葉がほかの操作で変わったら、欄の中身もそれに合わせる", () => {
    const { rerenderWith } = renderFilter(filterOf({ query: "鯖" }));
    expect(searchBox()).toHaveValue("鯖");

    rerenderWith(DEFAULT_FILTER);

    expect(searchBox()).toHaveValue("");
    act(() => vi.advanceTimersByTime(1000));
    expect(replace).not.toHaveBeenCalled();
  });
});
