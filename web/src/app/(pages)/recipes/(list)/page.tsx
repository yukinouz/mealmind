import type { Metadata } from "next";
import { Inner } from "@/app/(pages)/components/inner/inner";
import { PageHeader } from "@/app/(pages)/components/pageHeader/pageHeader";
import { Section } from "@/app/(pages)/components/section/section";
import { parseRecipeFilter, type SearchParams } from "@/utils/recipeFilter";
import { Recipes } from "../components/recipes/recipes";

// description は決めないので、layout の既定の説明文が使われる
export const metadata: Metadata = {
  title: "レシピ一覧",
};

interface RecipesPageProps {
  searchParams: Promise<SearchParams>;
}

// 絞り込みの条件は URL（?meal=lunch&cuisine=chuka など）から読む
// searchParams を使うので、開くたびにサーバーで作り直される
export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const filter = parseRecipeFilter(await searchParams);
  return (
    <main>
      <Section top bottom>
        <Inner>
          <PageHeader title="レシピ一覧" />
          <Recipes filter={filter} />
        </Inner>
      </Section>
    </main>
  );
}
