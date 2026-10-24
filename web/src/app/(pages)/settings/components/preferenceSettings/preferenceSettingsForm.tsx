"use client";

import { savePreferencesAction } from "@/actions/settings";
import type { PreferenceLists } from "@/lib/preferences";
import { ChipInput } from "../chipInput/chipInput";
import { LeaveDialog } from "../leaveDialog/leaveDialog";
import { SaveBar } from "../saveBar/saveBar";
import { useSettingsForm } from "../settingsForm/useSettingsForm";
import styles from "./_styles/_preferenceSettings.module.scss";

/** 項目ごとの名前・説明・例 */
const FIELDS: PreferenceField[] = [
  {
    key: "avoidIngredients",
    label: "使わない食材",
    help: "タイトルか概要欄にこの食材がある動画は提案しません。",
    placeholder: "例：レバー",
  },
  {
    key: "avoidSeasonings",
    label: "使わない調味料",
    help: "タイトルか概要欄にこの調味料がある動画は提案しません。",
    placeholder: "例：カルダモン",
  },
  {
    key: "pantryIngredients",
    label: "常備している食材",
    help: "いつも家にある食材です。レシピのメイン食材には選びません。",
    placeholder: "例：にんにく",
  },
  {
    key: "avoidTitleKeywords",
    label: "提案しないタイトルの言葉",
    help: "タイトルにこの言葉がある動画は提案しません。",
    placeholder: "例：ケーキ",
  },
];

interface PreferenceField {
  key: keyof PreferenceLists;
  label: string;
  help: string;
  placeholder: string;
}

interface PreferenceSettingsFormProps {
  initial: PreferenceLists;
}

/** 好みの設定。4つの言葉の一覧を、「保存する」でまとめて書き込む */
const PreferenceSettingsForm = ({ initial }: PreferenceSettingsFormProps) => {
  const form = useSettingsForm<PreferenceLists>({
    initial,
    save: savePreferencesAction,
  });
  const { draft, update } = form;

  return (
    <>
      <div className={styles.fields}>
        {FIELDS.map(({ key, label, help, placeholder }) => (
          <section
            className={styles.field}
            key={key}
            aria-labelledby={`pref-${key}`}
          >
            <h3 className={styles.fieldTitle} id={`pref-${key}`}>
              {label}
            </h3>
            <p className={styles.fieldHelp}>{help}</p>
            <div className={styles.chips}>
              <ChipInput
                inputLabel={`${label}に追加する言葉`}
                placeholder={placeholder}
                words={draft[key]}
                onChange={(words) =>
                  update((current) => ({ ...current, [key]: words }))
                }
              />
            </div>
          </section>
        ))}
      </div>

      <SaveBar {...form.saveBar} />
      <LeaveDialog isDirty={form.isDirty} />
    </>
  );
};

export { PreferenceSettingsForm };
