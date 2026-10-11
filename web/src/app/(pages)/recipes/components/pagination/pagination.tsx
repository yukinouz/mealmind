import { type PageItemsOptions, pageItems } from "@/utils/pagination";
import { type RecipeFilter, toRecipeQuery } from "@/utils/recipeFilter";
import styles from "./_styles/_pagination.module.scss";
import { PageLink } from "./pageLink";

// PC は先頭・末尾を2ページずつ、スマホは1ページずつ出す
// スマホは横幅に収まるよう、全部の番号を出すのを7ページまでにする
const PC_OPTIONS: PageItemsOptions = { edge: 2, maxShowAll: 8 };
const SP_OPTIONS: PageItemsOptions = { edge: 1, maxShowAll: 7 };

interface PaginationProps {
  filter: RecipeFilter;
  totalPages: number;
}

interface PageLinksProps extends PaginationProps {
  className: string;
  options: PageItemsOptions;
}

/** 1つのページ送り。最初のページでは「前へ」、最後のページでは「次へ」を出さない */
const PageLinks = ({
  filter,
  totalPages,
  className,
  options,
}: PageLinksProps) => {
  const current = filter.page;
  return (
    <nav className={className} aria-label="ページ送り">
      {current > 1 && (
        <PageLink
          className={styles.arrow}
          href={toHref(filter, current - 1)}
          aria-label="前のページ"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 5-7 7 7 7" />
          </svg>
        </PageLink>
      )}
      {pageItems(current, totalPages, options).map((page, index) =>
        page === null ? (
          // 「…」は前後の番号で位置が決まるので、何番目かを key にする
          // biome-ignore lint/suspicious/noArrayIndexKey: 「…」には ID がない
          <span className={styles.gap} key={`gap-${index}`} aria-hidden="true">
            …
          </span>
        ) : (
          <PageLink
            className={styles.page}
            key={page}
            href={toHref(filter, page)}
            aria-label={`${page}ページ目`}
            aria-current={page === current ? "page" : undefined}
          >
            {page}
          </PageLink>
        ),
      )}
      {current < totalPages && (
        <PageLink
          className={styles.arrow}
          href={toHref(filter, current + 1)}
          aria-label="次のページ"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 5 7 7-7 7" />
          </svg>
        </PageLink>
      )}
    </nav>
  );
};

/** そのページの URL。絞り込みなどの条件はそのまま残す */
const toHref = (filter: RecipeFilter, page: number): string => {
  const query = toRecipeQuery({ ...filter, page });
  return query === "" ? "/recipes" : `/recipes?${query}`;
};

/** レシピ一覧のページ送り。PC とスマホで番号の数が違うので、2つ置いて片方だけ出す。1ページしかなければ出さない */
const Pagination = ({ filter, totalPages }: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <>
      <PageLinks
        filter={filter}
        totalPages={totalPages}
        className={styles.pc}
        options={PC_OPTIONS}
      />
      <PageLinks
        filter={filter}
        totalPages={totalPages}
        className={styles.sp}
        options={SP_OPTIONS}
      />
    </>
  );
};

export { Pagination };
