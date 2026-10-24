"use client";

import { clsx } from "clsx";
import { useId } from "react";
import type { ChannelSetting, VideoCache } from "@/lib/sources";
import { clampWeight, videosNote } from "@/utils/channelSettings";
import styles from "./_styles/_channelSettings.module.scss";

/** 動画一覧の取得のエラー。failed はこの画面で失敗した、missing は動画一覧がない */
export type FetchError = "failed" | "missing" | null;

interface ChannelRowProps {
  channel: ChannelSetting;
  // まだ保存していない、追加予定のチャンネルか
  isNew: boolean;
  videos: VideoCache | null;
  fetchError: FetchError;
  isUpdating: boolean;
  // 保存中や、ほかのチャンネルの更新中は「更新」を押せない
  canUpdate: boolean;
  onChange: (patch: Partial<ChannelSetting>) => void;
  onRemove: () => void;
  onUpdate: () => void;
}

/** チャンネルのページ（ハンドルがなければチャンネル ID）の URL */
const channelUrl = ({ handle, channelId }: ChannelSetting): string =>
  handle === null
    ? `https://www.youtube.com/channel/${channelId}`
    : `https://www.youtube.com/${handle}`;

/** 登録しているチャンネルの1行。表示名と割合を編集し、動画一覧を更新・チャンネルを削除できる */
const ChannelRow = ({
  channel,
  isNew,
  videos,
  fetchError,
  isUpdating,
  canUpdate,
  onChange,
  onRemove,
  onUpdate,
}: ChannelRowProps) => {
  const id = useId();
  const displayName = channel.shortName || channel.name;

  return (
    <li className={clsx(styles.row, isNew && styles.isNew)}>
      <div className={styles.rowInfo}>
        <div className={styles.rowTitle}>
          <b className={styles.rowName}>{channel.name}</b>
          {isNew && <span className={styles.newBadge}>追加予定</span>}
        </div>
        <a
          className={styles.rowHandle}
          href={channelUrl(channel)}
          target="_blank"
          rel="noreferrer"
        >
          {channel.handle ?? channel.channelId}
        </a>
        <div className={styles.rowVideos}>
          {isNew && <span>保存すると動画一覧を取得します</span>}
          {!isNew && videos !== null && (
            <span>{videosNote(videos.count, videos.fetchedAt)}</span>
          )}
          {/* 開いた時点から出ているものは読み上げで割り込まず、この画面で失敗したときだけ知らせる */}
          {fetchError !== null && (
            <span
              className={styles.fetchError}
              role={fetchError === "failed" ? "alert" : undefined}
            >
              取得できませんでした
            </span>
          )}
          {!isNew && (
            <button
              className={styles.updateLink}
              type="button"
              disabled={!canUpdate}
              aria-label={`「${displayName}」の動画一覧を更新する`}
              onClick={onUpdate}
            >
              {isUpdating ? "更新中…" : "更新"}
            </button>
          )}
        </div>
      </div>

      <div className={styles.shortName}>
        <label className={styles.fieldLabel} htmlFor={`${id}-short`}>
          表示名
        </label>
        <input
          className={styles.textInput}
          id={`${id}-short`}
          type="text"
          value={channel.shortName}
          onChange={(event) => onChange({ shortName: event.target.value })}
        />
      </div>

      <div className={styles.weight}>
        <label className={styles.fieldLabel} htmlFor={`${id}-weight`}>
          割合
        </label>
        <span className={styles.weightField}>
          <input
            className={styles.weightInput}
            id={`${id}-weight`}
            type="number"
            min="0"
            max="100"
            step="1"
            value={String(channel.weight)}
            onChange={(event) =>
              onChange({ weight: clampWeight(event.target.value) })
            }
          />
          <span aria-hidden="true">%</span>
        </span>
      </div>

      {/* 確認はせずに一覧から外す。確定は「保存する」、取り消しは「変更を取り消す」 */}
      <button
        className={styles.removeButton}
        type="button"
        aria-label={`「${displayName}」を削除する`}
        title={`「${displayName}」を削除する`}
        onClick={onRemove}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 7h16" />
          <path d="M10 11v6M14 11v6" />
          <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
          <path d="M9 7V4h6v3" />
        </svg>
      </button>
    </li>
  );
};

export { ChannelRow };
