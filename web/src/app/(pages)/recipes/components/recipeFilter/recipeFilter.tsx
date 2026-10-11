"use client";

import { usePathname, useRouter } from "next/navigation";
import { startTransition, useOptimistic } from "react";
import type { Meal } from "@/lib/recipes";
import type { Channel } from "@/lib/sources";
import type { Cuisine } from "@/utils/cuisine";
import {
  clearGroups,
  type RecipeFilter as Filter,
  hasAnyFilter,
  type RecipeOrder,
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

interface FavoriteToggleProps {
  isFavoriteOnly: boolean;
  onChange: (isFavoriteOnly: boolean) => void;
}

interface OrderToggleProps {
  order: RecipeOrder;
  onChange: (order: RecipeOrder) => void;
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

/** お気に入りのレシピだけを出す切り替え */
const FavoriteToggle = ({ isFavoriteOnly, onChange }: FavoriteToggleProps) => {
  return (
    <button
      className={styles.favorite}
      type="button"
      aria-pressed={isFavoriteOnly}
      aria-label="お気に入りのみ"
      onClick={() => onChange(!isFavoriteOnly)}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.7 7.9 3.8 4.5 7.2 4.5c2 0 3.5 1.1 4.8 2.9 1.3-1.8 2.8-2.9 4.8-2.9 3.4 0 5.5 3.4 4.4 6.6-1.7 4.8-9.2 9.4-9.2 9.4Z" />
      </svg>
      のみ
    </button>
  );
};

/** 追加日の新しい順・古い順の切り替え。いまの向きの矢印を濃く、もう片方を薄く出す */
const OrderToggle = ({ order, onChange }: OrderToggleProps) => {
  const label =
    order === "newest"
      ? "追加日が新しい順（押すと古い順）"
      : "追加日が古い順（押すと新しい順）";
  return (
    <button
      className={styles.order}
      type="button"
      data-order={order}
      aria-label={label}
      title={label}
      onClick={() => onChange(order === "newest" ? "oldest" : "newest")}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path className={styles.up} d="M8 19V5M4 9l4-4 4 4" />
        <path className={styles.down} d="M16 5v14M12 15l4 4 4-4" />
      </svg>
    </button>
  );
};

/**
 * レシピ一覧の絞り込み欄と、その下の ♡のみ・並び順の行。条件は URL に持たせ、一覧の絞り込みと並べ替えはサーバーで行う
 * 押したらすぐ選択の見た目を変え、URL の書き換えはその後に行う
 */
export const RecipeFilter = ({ filter, channels }: RecipeFilterProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [shownFilter, setShownFilter] = useOptimistic(filter);

  /** 条件を変えて URL を書き換える。履歴は増やさず、スクロール位置もそのままにする */
  const changeFilter = (next: Filter) => {
    const query = toRecipeQuery(next);
    // 押された「すべて」を押し直したときなど、条件が変わらなければ何もしない
    if (query === toRecipeQuery(shownFilter)) return;

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
    <>
      <section className={styles.filter} aria-labelledby="filter-heading">
        <div className={styles.header}>
          <h2 className={styles.heading} id="filter-heading">
            絞り込み
          </h2>
          {hasAnyFilter(shownFilter) && (
            <button
              className={styles.clear}
              type="button"
              onClick={() => changeFilter(clearGroups(shownFilter))}
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
      <div className={styles.controls}>
        <FavoriteToggle
          isFavoriteOnly={shownFilter.isFavoriteOnly}
          onChange={(isFavoriteOnly) =>
            changeFilter({ ...shownFilter, isFavoriteOnly })
          }
        />
        <OrderToggle
          order={shownFilter.order}
          onChange={(order) => changeFilter({ ...shownFilter, order })}
        />
      </div>
    </>
  );
};
