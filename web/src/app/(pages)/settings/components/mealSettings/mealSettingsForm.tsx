"use client";

import { useId, useState } from "react";
import { saveMealsAction } from "@/actions/settings";
import {
  type GenreForm,
  type GenreMode,
  MEALS,
  type MealForm,
  type MealsForm,
  mealsInvalidReason,
  removeGenre,
} from "@/utils/mealSettings";
import { ChipInput } from "../chipInput/chipInput";
import { LeaveDialog } from "../leaveDialog/leaveDialog";
import { SaveBar } from "../saveBar/saveBar";
import { useSettingsForm } from "../settingsForm/useSettingsForm";
import styles from "./_styles/_mealSettings.module.scss";

/** 提案するジャンルの選び方 */
const MODES: { id: GenreMode; label: string }[] = [
  { id: "all", label: "すべてのジャンル" },
  { id: "only", label: "選んだジャンルだけ" },
  { id: "except", label: "選んだジャンル以外" },
];

interface MealSettingsFormProps {
  initial: MealsForm;
}

interface MealCardProps {
  meal: MealForm;
  label: string;
  genres: GenreForm[];
  onChange: (patch: Partial<MealForm>) => void;
}

interface GenreCardProps {
  genre: GenreForm;
  onChange: (patch: Partial<GenreForm>) => void;
  onRemove: () => void;
}

/** 食事ごとの条件。提案するジャンルの選び方と、この食事で提案しないタイトルの言葉 */
const MealCard = ({ meal, label, genres, onChange }: MealCardProps) => {
  const id = useId();

  /** ジャンルを選ぶ・外す */
  const toggleGenre = (key: string) =>
    onChange({
      genreKeys: meal.genreKeys.includes(key)
        ? meal.genreKeys.filter((genreKey) => genreKey !== key)
        : [...meal.genreKeys, key],
    });

  return (
    <div className={styles.card}>
      <h4 className={styles.mealTitle}>
        <span className={styles.mealBadge} data-meal={meal.id}>
          {label}
        </span>
      </h4>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>提案するジャンル</legend>
        <div className={styles.modes}>
          {MODES.map((mode) => (
            <label className={styles.choice} key={mode.id}>
              <input
                className={styles.radio}
                type="radio"
                name={`${id}-mode`}
                checked={meal.mode === mode.id}
                onChange={() => onChange({ mode: mode.id })}
              />
              {mode.label}
            </label>
          ))}
        </div>
        {meal.mode !== "all" && (
          <fieldset className={styles.genreToggles}>
            <legend className={styles.visuallyHidden}>
              {label}の対象にするジャンル
            </legend>
            {genres.map((genre) => (
              <label className={styles.choice} key={genre.key}>
                <input
                  className={styles.checkbox}
                  type="checkbox"
                  checked={meal.genreKeys.includes(genre.key)}
                  onChange={() => toggleGenre(genre.key)}
                />
                <span className={styles.checkBox} aria-hidden="true">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                {genre.name || "（名前なし）"}
              </label>
            ))}
            {genres.length === 0 && (
              <span className={styles.noGenre}>
                下の「ジャンルを追加」から登録してください
              </span>
            )}
          </fieldset>
        )}
      </fieldset>

      <div className={styles.words}>
        <span className={styles.wordsTitle}>
          この食事で提案しないタイトルの言葉
        </span>
        <ChipInput
          inputLabel={`${label}で提案しないタイトルの言葉`}
          placeholder="例：鍋"
          words={meal.keywords}
          isCompact
          onChange={(keywords) => onChange({ keywords })}
        />
      </div>
    </div>
  );
};

/** ジャンル1つ分。名前と、タイトルで見分ける言葉 */
const GenreCard = ({ genre, onChange, onRemove }: GenreCardProps) => {
  const id = useId();
  const displayName = genre.name.trim() || "名前なし";

  return (
    <div className={styles.genreCard}>
      <button
        className={styles.removeButton}
        type="button"
        aria-label={`「${displayName}」のジャンルを削除する`}
        title={`「${displayName}」のジャンルを削除する`}
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
      <div className={styles.nameField}>
        <label className={styles.nameLabel} htmlFor={`${id}-name`}>
          ジャンル名
        </label>
        <input
          className={styles.nameInput}
          id={`${id}-name`}
          type="text"
          value={genre.name}
          placeholder="例：麺類"
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </div>
      <div className={styles.words}>
        <span className={styles.wordsTitle}>見分ける言葉</span>
        <ChipInput
          inputLabel={`${genre.name.trim() || "このジャンル"}を見分ける言葉`}
          placeholder="例：うどん"
          words={genre.keywords}
          isCompact
          onChange={(keywords) => onChange({ keywords })}
        />
      </div>
    </div>
  );
};

/**
 * 食事とジャンルの設定。「保存する」で genres と meals をまとめて書き込む
 * ジャンル名を変えても、食事の条件は key で結んでいるので、保存するときに新しい名前で書かれる
 */
const MealSettingsForm = ({ initial }: MealSettingsFormProps) => {
  // 追加したジャンルの key。読み込んだジャンル（genre-0 など）と重ならないようにする
  const [nextNewKey, setNextNewKey] = useState(1);
  const form = useSettingsForm<MealsForm>({
    initial,
    save: saveMealsAction,
    invalidReason: mealsInvalidReason,
  });
  const { draft, update } = form;

  /** 食事の条件を変える */
  const changeMeal = (id: string, patch: Partial<MealForm>) =>
    update((current) => ({
      ...current,
      meals: current.meals.map((meal) =>
        meal.id === id ? { ...meal, ...patch } : meal,
      ),
    }));

  /** ジャンルの名前や言葉を変える */
  const changeGenre = (key: string, patch: Partial<GenreForm>) =>
    update((current) => ({
      ...current,
      genres: current.genres.map((genre) =>
        genre.key === key ? { ...genre, ...patch } : genre,
      ),
    }));

  /** 名前と言葉が空のジャンルを、最後に足す */
  const addGenre = () => {
    const key = `new-${nextNewKey}`;
    setNextNewKey((count) => count + 1);
    update((current) => ({
      ...current,
      genres: [...current.genres, { key, name: "", keywords: [] }],
    }));
  };

  return (
    <>
      <section aria-labelledby="meals-title">
        <h3 className={styles.sectionTitle} id="meals-title">
          食事ごとの条件
        </h3>
        <div className={styles.cards}>
          {MEALS.map(({ id, label }) => {
            const meal = draft.meals.find((item) => item.id === id);
            if (meal === undefined) return null;
            return (
              <MealCard
                key={id}
                meal={meal}
                label={label}
                genres={draft.genres}
                onChange={(patch) => changeMeal(id, patch)}
              />
            );
          })}
        </div>
      </section>

      <section className={styles.genres} aria-labelledby="genres-title">
        <h3 className={styles.sectionTitle} id="genres-title">
          ジャンル
        </h3>
        <p className={styles.sectionLead}>
          タイトルにここの言葉がひとつでもある動画を、そのジャンルとみなします。
        </p>
        <div className={styles.genreCards}>
          {draft.genres.map((genre) => (
            <GenreCard
              key={genre.key}
              genre={genre}
              onChange={(patch) => changeGenre(genre.key, patch)}
              onRemove={() =>
                update((current) => removeGenre(current, genre.key))
              }
            />
          ))}
        </div>
        <button className={styles.addGenre} type="button" onClick={addGenre}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          ジャンルを追加
        </button>
      </section>

      <SaveBar {...form.saveBar} />
      <LeaveDialog isDirty={form.isDirty} />
    </>
  );
};

export { MealSettingsForm };
