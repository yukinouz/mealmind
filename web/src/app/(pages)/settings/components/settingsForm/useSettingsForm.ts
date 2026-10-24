"use client";

import { useState, useTransition } from "react";
import type { SaveBarTone } from "../saveBar/saveBar";

/** 保存の結果。サーバーアクションの戻り値と同じ形 */
export type SaveResult = { type: "saved" } | { type: "error" };

/** 保存のようす。idle はまだ保存していない、saved は保存できた、error は保存できなかった */
type SaveStatus = "idle" | "saved" | "error";

interface SettingsFormOptions<T> {
  initial: T;
  save: (value: T) => Promise<SaveResult>;
  // 変更があっても保存できない理由（空のジャンル名など）。保存できるなら null
  invalidReason?: (value: T) => string | null;
}

/** 保存バーに渡す値。SaveBar の props にそのまま渡せる */
interface SaveBarState {
  message: string;
  tone: SaveBarTone;
  canDiscard: boolean;
  canSave: boolean;
  saveLabel: string;
  onDiscard: () => void;
  onSave: () => void;
}

/** 保存バーの文言と色 */
const messageOf = (
  isSaving: boolean,
  isDirty: boolean,
  status: SaveStatus,
  invalid: string | null,
): Pick<SaveBarState, "message" | "tone"> => {
  if (isSaving) return { message: "保存しています…", tone: "muted" };
  if (status === "error") {
    return {
      message: "保存できませんでした。もう一度「保存する」を押してください",
      tone: "error",
    };
  }
  if (!isDirty) {
    return {
      message: status === "saved" ? "保存しました" : "変更はありません",
      tone: "muted",
    };
  }
  if (invalid !== null) return { message: invalid, tone: "error" };
  return { message: "未保存の変更があります", tone: "dirty" };
};

/**
 * 設定のページの編集中の値を持つ。「保存する」を押すまで書き込まず、「変更を取り消す」で保存済みの値に戻す
 * 変更の有無は、保存済みの値と JSON にして比べる
 */
export const useSettingsForm = <T>({
  initial,
  save,
  invalidReason,
}: SettingsFormOptions<T>) => {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [isSaving, startSaving] = useTransition();

  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const invalid = invalidReason?.(draft) ?? null;

  /** 編集中の値を変える。保存の結果のお知らせは消す */
  const update = (next: (current: T) => T) => {
    setDraft(next);
    setStatus("idle");
  };

  const submit = () =>
    startSaving(async () => {
      const result = await save(draft);
      if (result.type === "error") return setStatus("error");
      setSaved(draft);
      setStatus("saved");
    });

  const saveBar: SaveBarState = {
    ...messageOf(isSaving, isDirty, status, invalid),
    canDiscard: isDirty && !isSaving,
    canSave: isDirty && invalid === null && !isSaving,
    saveLabel: isSaving ? "保存中…" : "保存する",
    onDiscard: () => {
      setDraft(saved);
      setStatus("idle");
    },
    onSave: submit,
  };

  return { draft, update, isDirty, isSaving, saveBar };
};
