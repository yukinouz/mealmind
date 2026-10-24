"use client";

import { useState, useTransition } from "react";
import type { SaveResult } from "@/actions/settings";
import type { SaveBarProps, SaveBarTone } from "../saveBar/saveBar";

// 保存の結果の形は、サーバーアクションと同じものを使う
export type { SaveResult };

/** 保存のようす。idle はまだ保存していない、saved は保存できた、error は保存できなかった */
type SaveStatus =
  | { type: "idle" }
  | { type: "saved"; message: string }
  | { type: "error" };

/** 変更があるとき・保存しているときの、ページごとの文言 */
interface FormMessages {
  dirty?: string;
  saving?: string;
}

interface SettingsFormOptions<T> {
  initial: T;
  // saved は保存済みの値。変更の中身に合わせて保存の結果の文言を変えるときに使う
  save: (value: T, saved: T) => Promise<SaveResult>;
  // 変更があっても保存できない理由（空のジャンル名など）。保存できるなら null
  invalidReason?: (value: T) => string | null;
  // 変更の中身に合わせた文言（追加 1件 など）。なければ決まった文言
  messages?: (draft: T, saved: T) => FormMessages;
  // ほかの処理（動画一覧の更新など）が動いているあいだは、保存させない
  isLocked?: boolean;
}

/** 保存バーの文言と色 */
const messageOf = (
  isSaving: boolean,
  isDirty: boolean,
  status: SaveStatus,
  invalid: string | null,
  messages: FormMessages,
): { message: string; tone: SaveBarTone } => {
  if (isSaving) {
    return { message: messages.saving ?? "保存しています…", tone: "muted" };
  }
  if (status.type === "error") {
    return {
      message: "保存できませんでした。もう一度「保存する」を押してください",
      tone: "error",
    };
  }
  if (!isDirty) {
    return {
      message: status.type === "saved" ? status.message : "変更はありません",
      tone: "muted",
    };
  }
  if (invalid !== null) return { message: invalid, tone: "error" };
  return {
    message: messages.dirty ?? "未保存の変更があります",
    tone: "dirty",
  };
};

/**
 * 設定のページの編集中の値を持つ。「保存する」を押すまで書き込まず、「変更を取り消す」で保存済みの値に戻す
 * 変更の有無は、保存済みの値と JSON にして比べる
 */
const useSettingsForm = <T>({
  initial,
  save,
  invalidReason,
  messages,
  isLocked = false,
}: SettingsFormOptions<T>) => {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [status, setStatus] = useState<SaveStatus>({ type: "idle" });
  const [isSaving, startSaving] = useTransition();

  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const invalid = invalidReason?.(draft) ?? null;

  /** 編集中の値を変える。保存の結果のお知らせは消す */
  const update = (next: (current: T) => T) => {
    setDraft(next);
    setStatus({ type: "idle" });
  };

  /** 押した時点の値を保存する。保存中に編集した分は、保存のあとも未保存の変更として残る */
  const submit = () => {
    const value = draft;
    startSaving(async () => {
      const result = await save(value, saved);
      if (result.type === "error") return setStatus({ type: "error" });
      setSaved(value);
      setStatus({ type: "saved", message: result.message ?? "保存しました" });
    });
  };

  const saveBar: Required<SaveBarProps> = {
    ...messageOf(
      isSaving,
      isDirty,
      status,
      invalid,
      messages?.(draft, saved) ?? {},
    ),
    canDiscard: isDirty && !isSaving,
    canSave: isDirty && invalid === null && !isSaving && !isLocked,
    saveLabel: isSaving ? "保存中…" : "保存する",
    onDiscard: () => {
      setDraft(saved);
      setStatus({ type: "idle" });
    },
    onSave: submit,
  };

  return { draft, saved, update, isDirty, isSaving, saveBar };
};

export { useSettingsForm };
