import Image from "next/image";
import { pageItems } from "@/utils/pagination";
import { type RecipeFilter, toRecipeQuery } from "@/utils/recipeFilter";
import styles from "./_styles/_pagination.module.scss";
import { PageLink } from "./pageLink";

interface PaginationProps {
  filter: RecipeFilter;
  totalPages: number;
  // ページ送りするページのパス。渡さないときはレシピ一覧
  basePath?: string;
}

/** そのページの URL。絞り込みなどの条件はそのまま残す */
const toHref = (basePath: string, filter: RecipeFilter, page: number) => {
  const query = toRecipeQuery({ ...filter, page });
  return query === "" ? basePath : `${basePath}?${query}`;
};

/**
 * レシピ一覧のページ送り。1ページしかなければ出さない
 * 最初のページでは「前へ」、最後のページでは「次へ」を出さない
 */
const Pagination = ({
  filter,
  totalPages,
  basePath = "/recipes",
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const current = filter.page;
  return (
    <nav className={styles.pagination} aria-label="ページ送り">
      {current > 1 && (
        <PageLink
          className={styles.arrow}
          href={toHref(basePath, filter, current - 1)}
          aria-label="前のページ"
        >
          <Image
            src="/images/icon/icon-bracket-left.svg"
            alt=""
            width={20}
            height={20}
          />
        </PageLink>
      )}
      {pageItems(current, totalPages).map((page, index) =>
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
            href={toHref(basePath, filter, page)}
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
          href={toHref(basePath, filter, current + 1)}
          aria-label="次のページ"
        >
          <Image
            src="/images/icon/icon-bracket-right.svg"
            alt=""
            width={20}
            height={20}
          />
        </PageLink>
      )}
    </nav>
  );
};

export { Pagination };
