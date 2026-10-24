"use client";

import { useState, useTransition } from "react";
import { lookupChannelAction } from "@/actions/settings";
import type { FoundChannel } from "@/lib/channelScripts";
import styles from "./_styles/_channelSettings.module.scss";

interface ChannelAdderProps {
  // 画面で追加予定のチャンネル。保存前でも、同じチャンネルを二重に追加しないため
  pendingChannelIds: string[];
  onAdd: (channel: FoundChannel) => void;
}

/** 「チャンネルを追加」。URL かハンドルで探し、見つかったチャンネルを一覧に追加する（確定は「保存する」） */
const ChannelAdder = ({ pendingChannelIds, onAdd }: ChannelAdderProps) => {
  const [query, setQuery] = useState("");
  const [candidate, setCandidate] = useState<FoundChannel | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLooking, startLooking] = useTransition();

  /** 入力した URL かハンドルでチャンネルを探す */
  const lookup = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query.trim() === "") {
      setCandidate(null);
      setErrorMessage("URL かハンドルを入力してください");
      return;
    }

    startLooking(async () => {
      const result = await lookupChannelAction(query, pendingChannelIds);
      if (result.type === "error") {
        setCandidate(null);
        setErrorMessage(result.message);
        return;
      }
      setCandidate(result.channel);
      setErrorMessage("");
    });
  };

  /** 見つかったチャンネルを一覧に加え、入力欄を空にする */
  const add = () => {
    if (candidate === null) return;
    onAdd(candidate);
    setCandidate(null);
    setQuery("");
  };

  return (
    <section className={styles.adder} aria-labelledby="add-title">
      <h3 className={styles.sectionTitle} id="add-title">
        チャンネルを追加
      </h3>
      <p className={styles.sectionLead}>
        YouTube のチャンネルの URL か、@から始まるハンドルを入力してください。
      </p>
      <form className={styles.lookupForm} onSubmit={lookup}>
        <label className={styles.visuallyHidden} htmlFor="channel-query">
          チャンネルの URL またはハンドル
        </label>
        <input
          className={styles.queryInput}
          id="channel-query"
          type="text"
          value={query}
          placeholder="https://www.youtube.com/@... または @..."
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value);
            setErrorMessage("");
          }}
        />
        <button
          className={styles.lookupButton}
          type="submit"
          disabled={isLooking}
        >
          {isLooking ? "探しています…" : "探す"}
        </button>
      </form>

      {errorMessage !== "" && (
        <p className={styles.lookupError} role="alert">
          {errorMessage}
        </p>
      )}

      {candidate !== null && (
        <div className={styles.candidate}>
          <div className={styles.candidateInfo}>
            <b className={styles.rowName}>{candidate.name}</b>
            <span className={styles.candidateHandle}>
              {candidate.handle ?? candidate.channelId}
            </span>
          </div>
          <div className={styles.candidateActions}>
            <button
              className={styles.cancelButton}
              type="button"
              onClick={() => setCandidate(null)}
            >
              やめる
            </button>
            <button className={styles.addButton} type="button" onClick={add}>
              追加する
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export { ChannelAdder };
