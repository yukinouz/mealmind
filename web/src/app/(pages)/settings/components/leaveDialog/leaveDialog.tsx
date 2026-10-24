"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./_styles/_leaveDialog.module.scss";

/** 移ろうとしたリンクの行き先と、ダイアログに出すその名前 */
interface LeaveTarget {
  href: string;
  label: string;
}

interface LeaveDialogProps {
  // 未保存の変更があるか。あるときだけ、リンクを押したときに確認する
  isDirty: boolean;
}

/** リンクの名前。ブラウザと同じく aria-label を先に使い、なければ文字、それもなければ画像の代わりの文字（ロゴなど） */
const labelOf = (link: HTMLAnchorElement): string =>
  link.getAttribute("aria-label") ||
  link.textContent?.trim() ||
  link.querySelector("img")?.alt ||
  "別のページ";

/**
 * 未保存の変更があるまま、ページの中のリンクで別のページへ移ろうとしたら止めて、行き先を返す
 * 左のメニューだけでなくヘッダーのリンクも対象にするため、ページ全体でリンクの押下を拾う
 * タブを閉じる・再読み込みするときは beforeunload で、ブラウザが決まった文言で確認を出す
 */
const useLeaveGuard = (isDirty: boolean) => {
  const [target, setTarget] = useState<LeaveTarget | null>(null);

  useEffect(() => {
    if (!isDirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();

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

      // サイトの外と、いまと同じページへのリンクは止めない
      const url = new URL(link.href);
      const isSamePage =
        url.pathname === location.pathname && url.search === location.search;
      if (url.origin !== location.origin || isSamePage) return;

      event.preventDefault();
      event.stopPropagation();
      setTarget({
        href: `${url.pathname}${url.search}${url.hash}`,
        label: labelOf(link),
      });
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, [isDirty]);

  return { target, stay: () => setTarget(null) };
};

/** 未保存の変更があるまま別のページへ移ろうとしたときの確認。Esc は「このページに残る」と同じ */
const LeaveDialog = ({ isDirty }: LeaveDialogProps) => {
  const { target, stay } = useLeaveGuard(isDirty);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const titleId = useId();
  const descId = useId();
  const isOpen = target !== null;

  /** 先に閉じてから移る。移り先の準備ができるまでの間に、もう一度押されないようにするため */
  const leave = () => {
    if (target === null) return;
    stay();
    router.push(target.href);
  };

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
      aria-labelledby={titleId}
      aria-describedby={descId}
      onCancel={(event) => {
        event.preventDefault();
        stay();
      }}
      // Esc を続けて押すと、onCancel を止められずに閉じることがある。そのときも状態をそろえる
      onClose={stay}
    >
      <h2 className={styles.title} id={titleId}>
        変更が保存されていません
      </h2>
      <p className={styles.text} id={descId}>
        このまま「{target?.label}」に移ると、このページの変更は取り消されます。
      </p>
      <div className={styles.actions}>
        <button className={styles.leave} type="button" onClick={leave}>
          保存せずに移る
        </button>
        {/* Enter だけで変更が消えないよう、開いたときは「このページに残る」を選んでおく */}
        <button
          className={styles.stay}
          type="button"
          // biome-ignore lint/a11y/noAutofocus: dialog の中で最初に選ぶボタンを決めるため（HTML の仕様で推奨される使い方）
          autoFocus
          onClick={stay}
        >
          このページに残る
        </button>
      </div>
    </dialog>
  );
};

export { LeaveDialog };
