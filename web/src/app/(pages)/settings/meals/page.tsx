import type { Metadata } from "next";
import { connection } from "next/server";
import { readMealsData } from "@/lib/preferences";
import { toMealsForm } from "@/utils/mealSettings";
import { MealSettingsForm } from "../components/mealSettings/mealSettingsForm";
import { SettingsHeading } from "../components/settingsHeading/settingsHeading";

export const metadata: Metadata = {
  title: "設定：食事とジャンル",
};

export default async function MealsSettingsPage() {
  // ビルドのときに読んだ値で固めず、開くたびに preferences.json を読む
  await connection();
  const data = await readMealsData();

  return (
    <>
      <SettingsHeading
        title="食事とジャンル"
        lead="昼食・夕食ごとに、どのジャンルのレシピを提案するかを決めます。ジャンルは、タイトルにふくまれる言葉で見分けます。"
      />
      <MealSettingsForm initial={toMealsForm(data)} />
    </>
  );
}
