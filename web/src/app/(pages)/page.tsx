import Link from "next/link";
import { RecipePicker } from "./recipe-picker";

export default function Home() {
  return (
    <main>
      <h1>Welcome to Mealmind</h1>
      <p>
        <Link href="/recipes">レシピ一覧</Link>
      </p>
      <RecipePicker />
    </main>
  );
}
