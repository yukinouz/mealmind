import { RecipeManageProvider } from "../components/recipeManage/recipeManage";

/** 非表示レシピのページのレイアウト。ページ送りや検索で URL が変わっても、「レシピを整理する」の戻す予定を残す */
export default function HiddenRecipesLayout({
  children,
}: LayoutProps<"/recipes/hidden">) {
  return <RecipeManageProvider mode="restore">{children}</RecipeManageProvider>;
}
