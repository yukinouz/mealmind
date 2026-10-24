"use client";

import { useId } from "react";
import { saveSuggestSettingsAction } from "@/actions/settings";
import { clampInteger } from "@/utils/clampInteger";
import { SUGGEST_LIMITS, type SuggestForm } from "@/utils/suggestSettings";
import { LeaveDialog } from "../leaveDialog/leaveDialog";
import { SaveBar } from "../saveBar/saveBar";
import { useSettingsForm } from "../settingsForm/useSettingsForm";
import styles from "./_styles/_suggestSettings.module.scss";

/** 項目ごとの名前・説明・単位 */
const FIELDS: SuggestField[] = [
  {
    key: "chosen",
    label: "作ったことがあるレシピの出やすさ",
    help: "「作る」を選んだことがあるレシピの出やすさです。0% にすると提案しません。",
    unit: "%",
  },
  {
    key: "favorite",
    label: "お気に入りのレシピの出やすさ",
    help: "お気に入りにしたレシピの出やすさです。0% にすると提案しません。",
    unit: "%",
  },
  {
    key: "days",
    label: "もう一度提案するまでの日数",
    help: "「作る」を選んでからこの日数がたつまで、同じレシピは提案しません。",
    unit: "日",
  },
];

interface SuggestField {
  key: keyof SuggestForm;
  label: string;
  help: string;
  unit: string;
}

interface SuggestSettingsFormProps {
  initial: SuggestForm;
}

interface CompareProps {
  values: SuggestForm;
}

/** 出やすさのくらべ。まだ作っていないレシピを 100 としたときの、1件あたりの出やすさを棒で見せる */
const Compare = ({ values }: CompareProps) => {
  const bars = [
    { label: "まだ作っていない", value: 100, tone: styles.barNew },
    { label: "お気に入り", value: values.favorite, tone: styles.barFavorite },
    { label: "作ったことがある", value: values.chosen, tone: styles.barChosen },
  ];
  return (
    <section className={styles.compare} aria-labelledby="compare-title">
      <h3 className={styles.compareTitle} id="compare-title">
        出やすさのくらべ
      </h3>
      <p className={styles.compareLead}>
        まだ作っていないレシピを 100 としたときの、1件あたりの出やすさです。
      </p>
      <ul className={styles.bars}>
        {bars.map(({ label, value, tone }) => (
          <li className={styles.barRow} key={label}>
            <span className={styles.barLabel}>{label}</span>
            <div className={styles.barTrack} aria-hidden="true">
              <div className={tone} style={{ width: `${value}%` }} />
            </div>
            <span className={styles.barValue}>{value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

/** 提案のしかたの設定。出やすさ（%）と、もう一度提案するまでの日数を「保存する」でまとめて書き込む */
const SuggestSettingsForm = ({ initial }: SuggestSettingsFormProps) => {
  const id = useId();
  const form = useSettingsForm<SuggestForm>({
    initial,
    save: saveSuggestSettingsAction,
  });
  const { draft, update } = form;

  return (
    <>
      <ul className={styles.fields}>
        {FIELDS.map(({ key, label, help, unit }) => (
          <li className={styles.field} key={key}>
            <div className={styles.fieldText}>
              <label className={styles.fieldLabel} htmlFor={`${id}-${key}`}>
                {label}
              </label>
              <span className={styles.fieldHelp}>{help}</span>
            </div>
            <span className={styles.fieldInput}>
              <input
                className={styles.numberInput}
                id={`${id}-${key}`}
                type="number"
                min="0"
                max={SUGGEST_LIMITS[key].max}
                step="1"
                value={String(draft[key])}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    [key]: clampInteger(
                      event.target.value,
                      SUGGEST_LIMITS[key].max,
                    ),
                  }))
                }
              />
              <span className={styles.unit} aria-hidden="true">
                {unit}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <Compare values={draft} />

      <SaveBar {...form.saveBar} />
      <LeaveDialog isDirty={form.isDirty} />
    </>
  );
};

export { SuggestSettingsForm };
