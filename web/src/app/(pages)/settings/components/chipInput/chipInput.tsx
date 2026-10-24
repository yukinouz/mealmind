"use client";

import { clsx } from "clsx";
import { useId, useState } from "react";
import styles from "./_styles/_chipInput.module.scss";

interface ChipInputProps {
  // 入力欄の名前（読み上げ用。画面には出さない）
  inputLabel: string;
  placeholder: string;
  words: string[];
  // 一覧と追加欄の間を詰める（食事とジャンルのページ）
  isCompact?: boolean;
  onChange: (words: string[]) => void;
}

/** 言葉の一覧をチップで見せ、追加欄で足し、× で外す。空の言葉と、すでにある言葉は追加しない */
const ChipInput = ({
  inputLabel,
  placeholder,
  words,
  isCompact = false,
  onChange,
}: ChipInputProps) => {
  const [draft, setDraft] = useState("");
  const inputId = useId();

  /** 入力した言葉を一覧の最後に足し、入力欄を空にする */
  const add = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const word = draft.trim();
    if (word === "" || words.includes(word)) return;

    onChange([...words, word]);
    setDraft("");
  };

  return (
    <>
      <ul className={styles.chips}>
        {words.map((word) => (
          <li className={styles.chip} key={word}>
            {word}
            <button
              className={styles.remove}
              type="button"
              aria-label={`「${word}」を外す`}
              title={`「${word}」を外す`}
              onClick={() => onChange(words.filter((item) => item !== word))}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </li>
        ))}
        {words.length === 0 && <li className={styles.empty}>まだありません</li>}
      </ul>
      <form
        className={clsx(styles.form, isCompact && styles.isCompact)}
        onSubmit={add}
      >
        <label className={styles.visuallyHidden} htmlFor={inputId}>
          {inputLabel}
        </label>
        <input
          className={styles.input}
          id={inputId}
          type="text"
          value={draft}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(event) => setDraft(event.target.value)}
        />
        <button className={styles.addButton} type="submit">
          追加
        </button>
      </form>
    </>
  );
};

export { ChipInput };
