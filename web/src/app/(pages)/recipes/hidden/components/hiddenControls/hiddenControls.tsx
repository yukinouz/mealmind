"use client";

import type { RecipeFilter as Filter } from "@/utils/recipeFilter";
import {
  OrderToggle,
  SearchBox,
  useFilterUrl,
} from "../../../components/recipeFilter/recipeFilter";
import { ManageToggle } from "../../../components/recipeManage/manageToggle";
import styles from "./_styles/_hiddenControls.module.scss";

interface HiddenControlsProps {
  filter: Filter;
  // 非表示レシピがあるか。ないときは整理するものがないので「レシピを整理する」を出さない
  hasRecipes: boolean;
}

/** 非表示レシピのページの、並び順・レシピを整理すると検索の行。条件は URL に持たせ、絞り込みと並べ替えはサーバーで行う */
const HiddenControls = ({ filter, hasRecipes }: HiddenControlsProps) => {
  const { shownFilter, changeCondition } = useFilterUrl(filter);

  return (
    <div className={styles.controls}>
      <div className={styles.toggles}>
        <OrderToggle
          order={shownFilter.order}
          dateLabel="非表示にした日"
          onChange={(order) => changeCondition({ ...shownFilter, order })}
        />
        {hasRecipes && <ManageToggle />}
      </div>
      <SearchBox
        query={shownFilter.query}
        onSearch={(query) => changeCondition({ ...shownFilter, query })}
      />
    </div>
  );
};

export { HiddenControls };
