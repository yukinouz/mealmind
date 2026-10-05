import { Inner } from "../components/inner/inner";
import { PageHeader } from "../components/pageHeader/pageHeader";
import { Recipes } from "./components/recipes/recipes";

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
