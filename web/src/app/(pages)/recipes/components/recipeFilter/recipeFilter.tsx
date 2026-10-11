"use client";

import { usePathname, useRouter } from "next/navigation";
import { startTransition, useOptimistic } from "react";
import type { Meal } from "@/lib/recipes";
import type { Channel } from "@/lib/sources";
import type { Cuisine } from "@/utils/cuisine";
import {
  EMPTY_FILTER,
  type RecipeFilter as Filter,
  hasAnyFilter,
  toggleValue,
  toRecipeQuery,
} from "@/utils/recipeFilter";
import styles from "./_styles/_recipeFilter.module.scss";

const MEAL_OPTIONS: Option<Meal>[] = [
  { value: "lunch", label: "昼食" },
  { value: "dinner", label: "夕食" },
];

const CUISINE_OPTIONS: Option<Cuisine>[] = [
  { value: "washoku", label: "和食" },
  { value: "yoshoku", label: "洋食" },
  { value: "chuka", label: "中華" },
  { value: "other", label: "その他" },
];

interface Option<T extends string> {
  value: T;
  label: string;
}

interface FilterGroupProps<T extends string> {
  label: string;
  options: Option<T>[];
  selected: T[];
  onChange: (selected: T[]) => void;
}

interface RecipeFilterProps {
  filter: Filter;
  channels: Channel[];
}

/** 1つの項目の行。先頭の「すべて」は選択を空に戻し、ほかは押すたびに選択・解除を切り替える */
const FilterGroup = <T extends string>({
  label,
  options,
  selected,
  onChange,
}: FilterGroupProps<T>) => {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.label}>{label}</legend>
      <div className={styles.options}>
        <button
          className={styles.chip}
          type="button"
          aria-pressed={selected.length === 0}
          onClick={() => onChange([])}
        >
          すべて
        </button>
        {options.map((option) => (
          <button
            className={styles.chip}
            type="button"
            key={option.value}
            aria-pressed={selected.includes(option.value)}
            onClick={() => onChange(toggleValue(selected, option.value))}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
};

/**
 * レシピ一覧の絞り込み欄。条件は URL に持たせ、一覧の絞り込みはサーバーで行う
 * 押したらすぐ選択の見た目を変え、URL の書き換えはその後に行う
 */
export const RecipeFilter = ({ filter, channels }: RecipeFilterProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [shownFilter, setShownFilter] = useOptimistic(filter);

  /** 条件を変えて URL を書き換える。履歴は増やさず、スクロール位置もそのままにする */
  const changeFilter = (next: Filter) => {
    const query = toRecipeQuery(next);
    startTransition(() => {
      setShownFilter(next);
      router.replace(query === "" ? pathname : `${pathname}?${query}`, {
        scroll: false,
      });
    });
  };

  const channelOptions = channels.map((channel) => ({
    value: channel.id,
    label: channel.label,
  }));

  return (
    <section className={styles.filter} aria-labelledby="filter-heading">
      <div className={styles.header}>
        <h2 className={styles.heading} id="filter-heading">
          絞り込み
        </h2>
        {hasAnyFilter(shownFilter) && (
          <button
            className={styles.clear}
            type="button"
            onClick={() => changeFilter({ ...shownFilter, ...EMPTY_FILTER })}
          >
            条件をクリア
          </button>
        )}
      </div>
      <FilterGroup
        label="食事"
        options={MEAL_OPTIONS}
        selected={shownFilter.meals}
        onChange={(meals) => changeFilter({ ...shownFilter, meals })}
      />
      <FilterGroup
        label="ジャンル"
        options={CUISINE_OPTIONS}
        selected={shownFilter.cuisines}
        onChange={(cuisines) => changeFilter({ ...shownFilter, cuisines })}
      />
      <FilterGroup
        label="チャンネル"
        options={channelOptions}
        selected={shownFilter.channels}
        onChange={(channels) => changeFilter({ ...shownFilter, channels })}
      />
    </section>
  );
};
