import type { Metadata } from "next";
import { Inner } from "@/app/(pages)/components/inner/inner";
import { PageHeader } from "@/app/(pages)/components/pageHeader/pageHeader";
import { Section } from "@/app/(pages)/components/section/section";
import { parseHiddenFilter } from "@/utils/hiddenFilter";
import type { SearchParams } from "@/utils/recipeFilter";
import { HiddenRecipes } from "./components/hiddenRecipes/hiddenRecipes";

export const metadata: Metadata = {
  title: "非表示レシピ一覧",
};

interface HiddenRecipesPageProps {
  searchParams: Promise<SearchParams>;
}

// 並び順・検索・ページは URL（?order=oldest&q=豚バラ&page=2 など）から読む
export default async function HiddenRecipesPage({
  searchParams,
}: HiddenRecipesPageProps) {
  const filter = parseHiddenFilter(await searchParams);
  return (
    <main>
      <Section top bottom>
        <Inner>
          <PageHeader title="非表示レシピ一覧" />
          <HiddenRecipes filter={filter} />
        </Inner>
      </Section>
    </main>
  );
}
