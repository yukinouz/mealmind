import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { ChipInput } from "./chipInput";

interface ChipsProps {
  initial: string[];
}

/** 言葉の一覧を持つ親と一緒に描く（ページと同じく、親が一覧を持つ） */
const Chips = ({ initial }: ChipsProps) => {
  const [words, setWords] = useState(initial);
  return (
    <ChipInput
      inputLabel="使わない食材に追加する言葉"
      placeholder="例：レバー"
      words={words}
      onChange={setWords}
    />
  );
};

const input = () =>
  screen.getByRole("textbox", { name: "使わない食材に追加する言葉" });
const chips = () =>
  screen.getAllByRole("listitem").map((item) => item.textContent);

describe("ChipInput", () => {
  it("入力して「追加」を押すと、最後にチップが増えて入力欄が空になる", async () => {
    const user = userEvent.setup();
    render(<Chips initial={["レバー"]} />);

    await user.type(input(), " パクチー ");
    await user.click(screen.getByRole("button", { name: "追加" }));

    expect(chips()).toEqual(["レバー", "パクチー"]);
    expect(input()).toHaveValue("");
  });

  it("Enter でも追加できる", async () => {
    const user = userEvent.setup();
    render(<Chips initial={[]} />);

    await user.type(input(), "セロリ{Enter}");

    expect(chips()).toEqual(["セロリ"]);
  });

  it("空の言葉と、すでにある言葉は追加しない", async () => {
    const user = userEvent.setup();
    render(<Chips initial={["レバー"]} />);

    await user.type(input(), "   {Enter}");
    await user.clear(input());
    await user.type(input(), "レバー{Enter}");

    expect(chips()).toEqual(["レバー"]);
  });

  it("× で外す。なくなったら「まだありません」と出す", async () => {
    const user = userEvent.setup();
    render(<Chips initial={["レバー"]} />);

    await user.click(screen.getByRole("button", { name: "「レバー」を外す" }));

    expect(chips()).toEqual(["まだありません"]);
  });
});
