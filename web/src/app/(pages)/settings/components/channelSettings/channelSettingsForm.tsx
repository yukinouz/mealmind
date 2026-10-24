"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { saveChannelsAction, updateVideosAction } from "@/actions/settings";
import type { FoundChannel } from "@/lib/channelScripts";
import type {
  ChannelSetting,
  ChannelWithVideos,
  VideoCache,
} from "@/lib/sources";
import {
  channelsInvalidReason,
  TOTAL_WEIGHT,
  toSourceId,
  totalWeight,
  totalWeightMessage,
} from "@/utils/channelSettings";
import { LeaveDialog } from "../leaveDialog/leaveDialog";
import { SaveBar } from "../saveBar/saveBar";
import {
  type SaveResult,
  useSettingsForm,
} from "../settingsForm/useSettingsForm";
import styles from "./_styles/_channelSettings.module.scss";
import { ChannelAdder } from "./channelAdder";
import { ChannelRow, type FetchError } from "./channelRow";

interface ChannelSettingsFormProps {
  initialChannels: ChannelWithVideos[];
}

interface TotalWeightProps {
  total: number;
}

/** 保存済みと比べた、追加・削除・変更の件数 */
interface ChannelsDiffCount {
  added: number;
  removed: number;
  edited: number;
}

/** 合計の欄。100% のときだけ緑、それ以外は赤で、足りない・多すぎる分を伝える */
const TotalWeight = ({ total }: TotalWeightProps) => {
  const isOk = total === TOTAL_WEIGHT;
  return (
    <div className={clsx(styles.total, isOk && styles.isOk)} role="status">
      <b className={styles.totalValue}>合計 {total}%</b>
      <div className={styles.totalBar} aria-hidden="true">
        <div
          className={styles.totalBarFill}
          style={{ width: `${Math.min(TOTAL_WEIGHT, total)}%` }}
        />
      </div>
      <span className={styles.totalMessage}>{totalWeightMessage(total)}</span>
    </div>
  );
};

/** 保存済みと比べて、追加・削除・変更の件数を数える */
const diffOf = (
  channels: ChannelSetting[],
  saved: ChannelSetting[],
): ChannelsDiffCount => {
  const savedById = new Map(saved.map((channel) => [channel.id, channel]));
  const ids = new Set(channels.map((channel) => channel.id));
  return {
    added: channels.filter((channel) => !savedById.has(channel.id)).length,
    removed: saved.filter((channel) => !ids.has(channel.id)).length,
    edited: channels.filter((channel) => {
      const before = savedById.get(channel.id);
      return (
        before !== undefined &&
        (before.weight !== channel.weight ||
          before.shortName !== channel.shortName)
      );
    }).length,
  };
};

/** 保存バーの文言。変更の件数と、保存すると動画一覧を取得することを伝える */
const messagesOf = (channels: ChannelSetting[], saved: ChannelSetting[]) => {
  const { added, removed, edited } = diffOf(channels, saved);
  const parts = [
    added > 0 ? `追加 ${added}件` : "",
    removed > 0 ? `削除 ${removed}件` : "",
    edited > 0 ? `変更 ${edited}件` : "",
  ].filter((part) => part !== "");
  return {
    dirty: `未保存の変更があります（${parts.join("・")}）${added > 0 ? "。保存すると動画一覧を取得します" : ""}`,
    saving:
      added > 0
        ? "保存して、追加したチャンネルの動画一覧を取得しています…"
        : "保存しています…",
  };
};

/**
 * 行に出す取得のエラー。この画面で取得に失敗したら failed、動画一覧がない（以前に取得できなかった）なら missing
 * missing も「取得できませんでした」と出し、「更新」で取り直せるようにする
 */
const fetchErrorOf = (
  isNew: boolean,
  videos: VideoCache | null,
  hasFailed: boolean,
): FetchError => {
  if (isNew) return null;
  if (hasFailed) return "failed";
  return videos === null ? "missing" : null;
};

/** 一覧に出す値から、動画一覧の情報を外して編集する形にする */
const toSetting = ({ videos: _, ...channel }: ChannelWithVideos) => channel;

/** id ごとの動画一覧の情報 */
const videosByIdOf = (channels: ChannelWithVideos[]) =>
  Object.fromEntries(channels.map((channel) => [channel.id, channel.videos]));

/**
 * チャンネルの設定。表示名・割合の編集、追加・削除は「保存する」でまとめて書き込む
 * 動画一覧の「更新」は、押したらすぐ実行する。保存と更新は同時に動かさない
 */
const ChannelSettingsForm = ({ initialChannels }: ChannelSettingsFormProps) => {
  const [videosById, setVideosById] = useState<
    Record<string, VideoCache | null>
  >(() => videosByIdOf(initialChannels));
  // この画面で動画一覧の取得に失敗したチャンネル。キャッシュが古いまま残っていても知らせる
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const isUpdating = updatingIds.length > 0;

  /** 保存して、追加したチャンネルの動画一覧を取得する */
  const save = async (
    channels: ChannelSetting[],
    before: ChannelSetting[],
  ): Promise<SaveResult> => {
    const result = await saveChannelsAction(channels);
    if (result.type === "error") return result;

    const savedIds = result.channels.map((channel) => channel.id);
    setVideosById(videosByIdOf(result.channels));
    setFailedIds((ids) => [
      ...ids.filter((id) => savedIds.includes(id)),
      ...result.failedIds,
    ]);
    const { added } = diffOf(channels, before);
    if (result.failedIds.length > 0) {
      return {
        type: "saved",
        message: "保存しました。動画一覧を取得できなかったチャンネルがあります",
      };
    }
    return {
      type: "saved",
      message:
        added > 0
          ? "保存して、追加したチャンネルの動画一覧を取得しました"
          : "保存しました",
    };
  };

  const form = useSettingsForm<ChannelSetting[]>({
    initial: initialChannels.map(toSetting),
    save,
    invalidReason: channelsInvalidReason,
    messages: messagesOf,
    isLocked: isUpdating,
  });
  const { draft: channels, saved, update } = form;
  const savedIds = saved.map((channel) => channel.id);
  const registeredIds = channels
    .map((channel) => channel.id)
    .filter((id) => savedIds.includes(id));

  /** 動画一覧を取り直す。行の「更新」はそのチャンネルだけ、「すべて更新」は登録済みの全チャンネル */
  const updateVideos = async (ids: string[]) => {
    setUpdatingIds(ids);
    // 通信が切れるなどして呼び出しそのものが失敗しても、「更新中…」のまま止まらないようにする
    const result = await updateVideosAction(ids).catch(
      () => ({ type: "error" }) as const,
    );
    setUpdatingIds([]);

    const failed = result.type === "done" ? result.failedIds : ids;
    if (result.type === "done") {
      setVideosById((current) => ({
        ...current,
        ...videosByIdOf(result.channels),
      }));
    }
    setFailedIds((current) => [
      ...current.filter((id) => !ids.includes(id)),
      ...failed,
    ]);
  };

  /** 探して見つかったチャンネルを、追加予定として一覧の最後に加える。最初の1件は割合 100% から始める */
  const add = (found: FoundChannel) =>
    update((current) => [
      ...current,
      {
        id: toSourceId(found.handle, [
          ...current.map((channel) => channel.id),
          ...savedIds,
        ]),
        name: found.name,
        shortName: found.name,
        handle: found.handle,
        channelId: found.channelId,
        weight: current.length === 0 ? TOTAL_WEIGHT : 0,
      },
    ]);

  /** 1つのチャンネルの値を変える */
  const change = (id: string, patch: Partial<ChannelSetting>) =>
    update((current) =>
      current.map((channel) =>
        channel.id === id ? { ...channel, ...patch } : channel,
      ),
    );

  /** チャンネルを一覧から外す（確定は「保存する」） */
  const remove = (id: string) =>
    update((current) => current.filter((channel) => channel.id !== id));

  const canUpdate = !isUpdating && !form.isSaving;

  return (
    <>
      <section aria-labelledby="channels-title">
        <div className={styles.listHeader}>
          <div className={styles.listHeading}>
            <h3 className={styles.sectionTitle} id="channels-title">
              登録しているチャンネル
            </h3>
            <span className={styles.count}>{channels.length}件</span>
          </div>
          {registeredIds.length > 0 && (
            <button
              className={styles.updateAllButton}
              type="button"
              disabled={!canUpdate}
              onClick={() => updateVideos(registeredIds)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
                <path d="M4 4v4h4" />
                <path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" />
                <path d="M20 20v-4h-4" />
              </svg>
              {isUpdating ? "更新中…" : "すべて更新"}
            </button>
          )}
        </div>

        {channels.length === 0 ? (
          <p className={styles.empty}>
            まだチャンネルがありません。下の「チャンネルを追加」から登録してください。
          </p>
        ) : (
          <>
            <ul className={styles.rows}>
              {channels.map((channel) => {
                const isNew = !savedIds.includes(channel.id);
                const videos = videosById[channel.id] ?? null;
                return (
                  <ChannelRow
                    key={channel.id}
                    channel={channel}
                    isNew={isNew}
                    videos={videos}
                    fetchError={fetchErrorOf(
                      isNew,
                      videos,
                      failedIds.includes(channel.id),
                    )}
                    isUpdating={updatingIds.includes(channel.id)}
                    canUpdate={canUpdate}
                    onChange={(patch) => change(channel.id, patch)}
                    onRemove={() => remove(channel.id)}
                    onUpdate={() => updateVideos([channel.id])}
                  />
                );
              })}
            </ul>
            <TotalWeight
              total={totalWeight(channels.map((channel) => channel.weight))}
            />
          </>
        )}
      </section>

      <ChannelAdder
        pendingChannelIds={channels.map((channel) => channel.channelId)}
        onAdd={add}
      />

      <SaveBar {...form.saveBar} />
      <LeaveDialog isDirty={form.isDirty} />
    </>
  );
};

export { ChannelSettingsForm };
