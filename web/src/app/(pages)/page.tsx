import { LinkButton } from "@/app/(pages)/components/linkButton/linkButton";
import { RecipePicker } from "./recipe-picker";

export default function Home() {
  return (
    <main>
      <h1>Welcome to Mealmind</h1>
      <p>
        <LinkButton href="/recipes" text="レシピ一覧" />
      </p>
      <RecipePicker />
    </main>
  );
}
