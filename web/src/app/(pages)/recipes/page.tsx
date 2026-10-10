import type { Metadata } from "next";
import { Inner } from "../components/inner/inner";
import { PageHeader } from "../components/pageHeader/pageHeader";
import { Recipes } from "./components/recipes/recipes";

// description は決めないので、layout の既定の説明文が使われる
export const metadata: Metadata = {
  title: "レシピ一覧",
};

export default function RecipesPage() {
  return (
    <main>
      <Inner>
        <PageHeader title="レシピ一覧" />
        <Recipes />
      </Inner>
    </main>
  );
}
