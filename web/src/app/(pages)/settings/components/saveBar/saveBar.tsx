import styles from "./_styles/_saveBar.module.scss";

/** 文言の色。muted は変更なし・保存中、dirty は保存できる変更あり、error は保存できない・失敗した */
export type SaveBarTone = "muted" | "dirty" | "error";

export interface SaveBarProps {
  message: string;
  tone: SaveBarTone;
  canDiscard: boolean;
  canSave: boolean;
  saveLabel?: string;
  onDiscard: () => void;
  onSave: () => void;
}

/** 設定の各ページの下に貼りつく保存バー。変更の有無・「変更を取り消す」・「保存する」 */
const SaveBar = ({
  message,
  tone,
  canDiscard,
  canSave,
  saveLabel = "保存する",
  onDiscard,
  onSave,
}: SaveBarProps) => {
  return (
    <div className={styles.bar}>
      <span className={styles.message} role="status" data-tone={tone}>
        {message}
      </span>
      <div className={styles.actions}>
        {canDiscard && (
          <button className={styles.discard} type="button" onClick={onDiscard}>
            変更を取り消す
          </button>
        )}
        <button
          className={styles.save}
          type="button"
          disabled={!canSave}
          onClick={onSave}
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
};

export { SaveBar };
