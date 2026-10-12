"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  use,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { hideRecipesAction } from "@/actions/hide";
import { restoreRecipesAction } from "@/actions/restore";
import { HIDDEN_RECIPES_PATH } from "@/utils/hiddenFilter";
import { toggleValue } from "@/utils/recipeFilter";
import styles from "./_styles/_recipeManage.module.scss";

/**
 * 整理の種類ごとの、ページ・保存の処理・文言
 * hide はレシピ一覧で削除する（excluded.json へ移す）、restore は非表示レシピのページで一覧に戻す（recipes.json へ移す）
 */
const MODES: Record<ManageMode, ManageModeConfig> = {
  hide: {
    path: "/recipes",
    save: hideRecipesAction,
    texts: {
      pending: "削除予定",
      action: "削除",
      toPending: (title) => `「${title}」を削除予定にする`,
      cancel: (title) => `「${title}」の削除を取り消す`,
      banner: (count) =>
        `整理中：削除予定 ${count}件。「完了」を押すと確定し、削除したレシピは今後提案されなくなります`,
      error: "削除できませんでした。もう一度「完了」を押してください。",
      notApplied: (count) =>
        `削除予定の ${count}件は、まだ削除されていません。`,
    },
  },
  restore: {
    path: HIDDEN_RECIPES_PATH,
    save: restoreRecipesAction,
    texts: {
      pending: "戻す予定",
      action: "一覧に戻す",
      toPending: (title) => `「${title}」をレシピ一覧に戻す予定にする`,
      cancel: (title) => `「${title}」をレシピ一覧に戻すのを取り消す`,
      banner: (count) =>
        `整理中：一覧に戻す予定 ${count}件。「完了」を押すと確定し、レシピ一覧に移ります`,
      error: "一覧に戻せませんでした。もう一度「完了」を押してください。",
      notApplied: (count) =>
        `一覧に戻す予定の ${count}件は、まだ戻っていません。`,
    },
  },
};

/** 整理の種類。hide はレシピ一覧で削除する、restore は非表示レシピのページで一覧に戻す */
export type ManageMode = "hide" | "restore";

/** 整理の画面に出す文言。title はレシピ名（短くしたもの）、count は予定の件数 */
interface ManageTexts {
  // 予定にしたレシピに付ける札
  pending: string;
  // 予定にするボタンの文字
  action: string;
  toPending: (title: string) => string;
  cancel: (title: string) => string;
  banner: (count: number) => string;
  error: string;
  // 予定を残したまま整理をやめる・ページを離れるときの説明
  notApplied: (count: number) => string;
}

interface ManageModeConfig {
  // 整理するページのパス。このページの中の移動（ページ送りなど）では予定を残す
  path: string;
  save: (ids: string[]) => Promise<{ type: "saved" } | { type: "error" }>;
  texts: ManageTexts;
}

interface RecipeManage {
  mode: ManageMode;
  texts: ManageTexts;
  isManaging: boolean;
  // 予定にしたレシピの id。「完了」を押すまで保存しない
  pendingIds: string[];
  isSaving: boolean;
  hasError: boolean;
  toggleManage: () => void;
  togglePending: (id: string) => void;
  finish: () => void;
}

interface RecipeManageProviderProps {
  mode: ManageMode;
  children: ReactNode;
}

interface LeaveDialogProps {
  isOpen: boolean;
  description: string;
  onDiscard: () => void;
  onKeep: () => void;
}

const RecipeManageContext = createContext<RecipeManage | null>(null);

/** 予定を残したまま「レシピを整理する」を押したときの確認。Esc は「整理を続ける」と同じ */
const LeaveDialog = ({
  isOpen,
  description,
  onDiscard,
  onKeep,
}: LeaveDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      className={styles.dialog}
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby="leave-title"
      aria-describedby="leave-desc"
      onCancel={(event) => {
        event.preventDefault();
        onKeep();
      }}
      // Esc を続けて押すと、onCancel を止められずに閉じることがある。そのときも状態をそろえる
      onClose={onKeep}
    >
      <h2 className={styles.dialogTitle} id="leave-title">
        変更が反映されていません
      </h2>
      <p className={styles.dialogText} id="leave-desc">
        {description}このまま戻ると、変更は取り消されます。
      </p>
      <div className={styles.dialogActions}>
        <button className={styles.discard} type="button" onClick={onDiscard}>
          変更を取り消して戻る
        </button>
        {/* Enter だけで変更が消えないよう、開いたときは「整理を続ける」を選んでおく */}
        <button
          className={styles.keep}
          type="button"
          // biome-ignore lint/a11y/noAutofocus: dialog の中で最初に選ぶボタンを決めるため（HTML の仕様で推奨される使い方）
          autoFocus
          onClick={onKeep}
        >
          整理を続ける
        </button>
      </div>
    </dialog>
  );
};

/** 予定を残したまま、タブを閉じる・再読み込みする・別のページへ移るときに確認を出す */
const useLeaveGuard = (
  hasPending: boolean,
  path: string,
  leaveMessage: string,
) => {
  useEffect(() => {
    if (!hasPending) return;

    // タブを閉じる・再読み込みするときは、ブラウザが決まった文言で確認を出す
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

    // サイトの中の移動は beforeunload が起きないので、リンクの押下を先に受け取って確かめる
    const onClick = (event: MouseEvent) => {
      // 新しいタブで開く押し方は、この画面が残るので確かめない
      const isNewTabClick =
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey;
      if (isNewTabClick || !(event.target instanceof Element)) return;

      const link = event.target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank") {
        return;
      }

      // 整理しているページの中の移動（ページ送りなど）は、予定を保ったまま続けられる
      const url = new URL(link.href);
      if (url.origin !== location.origin || url.pathname === path) return;
      if (window.confirm(leaveMessage)) return;

      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, [hasPending, path, leaveMessage]);
};

/** いまの URL から、ページの指定だけを外した URL。絞り込みなどの条件は残す */
const toFirstPageUrl = (): string => {
  const params = new URLSearchParams(location.search);
  params.delete("page");
  const query = params.toString();
  return query === "" ? location.pathname : `${location.pathname}?${query}`;
};

/** 「レシピを整理する」の状態を使う。RecipeManageProvider の中でだけ使える */
const useRecipeManage = (): RecipeManage => {
  const manage = use(RecipeManageContext);
  if (manage === null) {
    throw new Error("RecipeManageProvider の中で使ってください");
  }
  return manage;
};

/**
 * 「レシピを整理する」の状態を持つ。ページのレイアウトに置くので、ページ送りや絞り込みで URL が変わっても予定が残る
 * 予定は「完了」を押したときにまとめて保存する
 */
const RecipeManageProvider = ({
  mode,
  children,
}: RecipeManageProviderProps) => {
  const [isManaging, setIsManaging] = useState(false);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const router = useRouter();
  const { path, save, texts } = MODES[mode];

  useLeaveGuard(
    pendingIds.length > 0,
    path,
    `${texts.notApplied(pendingIds.length)}このまま移ると、変更は取り消されます。`,
  );

  /** 整理を終えて、予定とお知らせを消す */
  const reset = () => {
    setIsManaging(false);
    setPendingIds([]);
    setIsConfirming(false);
    setHasError(false);
  };

  /** 整理を始める・やめる。予定が残っていれば、やめる前に確認する */
  const toggleManage = () => {
    if (!isManaging) return setIsManaging(true);
    if (pendingIds.length > 0) return setIsConfirming(true);
    reset();
  };

  /**
   * 予定を確定する。保存中はボタンを押せなくする。失敗したときは予定を残し、もう一度押せるようにする
   * 確定したら1ページ目へ移る。レシピが減って、いまのページがなくなることがあるため
   */
  const finish = () => {
    if (pendingIds.length === 0) return reset();

    setHasError(false);
    startSaving(async () => {
      const result = await save(pendingIds);
      if (result.type === "error") return setHasError(true);
      reset();
      // 確定のあとに「戻る」で消えたページへ戻らないよう、履歴は増やさない
      router.replace(toFirstPageUrl(), { scroll: false });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const manage: RecipeManage = {
    mode,
    texts,
    isManaging,
    pendingIds,
    isSaving,
    hasError,
    toggleManage,
    togglePending: (id) => setPendingIds((ids) => toggleValue(ids, id)),
    finish,
  };

  return (
    <RecipeManageContext value={manage}>
      {children}
      <LeaveDialog
        isOpen={isConfirming}
        description={texts.notApplied(pendingIds.length)}
        onDiscard={reset}
        onKeep={() => setIsConfirming(false)}
      />
    </RecipeManageContext>
  );
};

export { RecipeManageProvider, useRecipeManage };
