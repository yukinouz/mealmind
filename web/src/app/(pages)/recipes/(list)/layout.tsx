import { RecipeManageProvider } from "../components/recipeManage/recipeManage";

/** レシピ一覧のレイアウト。非表示レシピのページとは削除予定を共有しないよう、ルートグループ (list) に分ける。ページ送りや絞り込みで URL が変わっても、「レシピを整理する」の削除予定を残す */
export default function RecipesLayout({ children }: LayoutProps<"/recipes">) {
  return <RecipeManageProvider>{children}</RecipeManageProvider>;
}
