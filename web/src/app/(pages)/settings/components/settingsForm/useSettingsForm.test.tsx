import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SaveBar } from "../saveBar/saveBar";
import { type SaveResult, useSettingsForm } from "./useSettingsForm";

interface FormProps {
  save: (value: string) => Promise<SaveResult>;
}

/** 言葉を1つ編集するだけのフォーム。保存バーはページと同じように下に置く */
const Form = ({ save }: FormProps) => {
  const { draft, update, saveBar } = useSettingsForm({
    initial: "鍋",
    save,
    invalidReason: (value) =>
      value === "" ? "空のままでは保存できません" : null,
  });
  return (
    <>
      <label>
        言葉
        <input
          value={draft}
          onChange={(event) => update(() => event.target.value)}
        />
      </label>
      <SaveBar {...saveBar} />
    </>
  );
};

const input = () => screen.getByRole("textbox", { name: "言葉" });
const saveButton = () => screen.getByRole("button", { name: "保存する" });
const discardButton = () =>
  screen.queryByRole("button", { name: "変更を取り消す" });

describe("保存バー", () => {
  it("変更がないときは「保存する」を押せず、「変更を取り消す」も出ない", () => {
    render(<Form save={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent("変更はありません");
    expect(saveButton()).toBeDisabled();
    expect(discardButton()).not.toBeInTheDocument();
  });

  it("変更すると「未保存の変更があります」になり、保存できる", async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockResolvedValue({ type: "saved" });
    render(<Form save={save} />);

    await user.type(input(), "焼き");
    expect(screen.getByRole("status")).toHaveTextContent(
      "未保存の変更があります",
    );

    await user.click(saveButton());

    expect(save).toHaveBeenCalledWith("鍋焼き", "鍋");
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("保存しました"),
    );
    // 保存した値が新しい基準になるので、変更なしに戻る
    expect(saveButton()).toBeDisabled();
  });

  it("保存できない値のときは理由を出し、「保存する」を押せない", async () => {
    const user = userEvent.setup();
    render(<Form save={vi.fn()} />);

    await user.clear(input());

    expect(screen.getByRole("status")).toHaveTextContent(
      "空のままでは保存できません",
    );
    expect(saveButton()).toBeDisabled();
  });

  it("保存に失敗したら、もう一度押すように知らせる。編集中の値は残す", async () => {
    const user = userEvent.setup();
    render(<Form save={vi.fn().mockResolvedValue({ type: "error" })} />);

    await user.type(input(), "焼き");
    await user.click(saveButton());

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "保存できませんでした",
      ),
    );
    expect(input()).toHaveValue("鍋焼き");
    expect(saveButton()).toBeEnabled();
  });

  it("保存中は「保存中…」になり、押せない。保存中に編集した分は、保存のあとも未保存として残る", async () => {
    const user = userEvent.setup();
    let finishSave: (result: SaveResult) => void = () => undefined;
    const save = vi.fn(
      () =>
        new Promise<SaveResult>((resolve) => {
          finishSave = resolve;
        }),
    );
    render(<Form save={save} />);

    await user.type(input(), "焼き");
    await user.click(saveButton());

    const savingButton = screen.getByRole("button", { name: "保存中…" });
    expect(savingButton).toBeDisabled();
    expect(discardButton()).not.toBeInTheDocument();

    await user.type(input(), "うどん");
    finishSave({ type: "saved" });

    expect(save).toHaveBeenCalledWith("鍋焼き", "鍋");
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "未保存の変更があります",
      ),
    );
    expect(saveButton()).toBeEnabled();
  });

  it("保存の結果に文言があれば、それを出す", async () => {
    const user = userEvent.setup();
    render(
      <Form
        save={vi.fn().mockResolvedValue({
          type: "saved",
          message: "保存して取得しました",
        })}
      />,
    );

    await user.type(input(), "焼き");
    await user.click(saveButton());

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "保存して取得しました",
      ),
    );
  });

  it("「変更を取り消す」で保存済みの値に戻る", async () => {
    const user = userEvent.setup();
    render(<Form save={vi.fn()} />);

    await user.type(input(), "焼き");
    await user.click(discardButton() as HTMLElement);

    expect(input()).toHaveValue("鍋");
    expect(screen.getByRole("status")).toHaveTextContent("変更はありません");
  });
});
