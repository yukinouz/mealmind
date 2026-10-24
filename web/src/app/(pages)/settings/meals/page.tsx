import type { Metadata } from "next";
import { SettingsHeading } from "../components/settingsHeading/settingsHeading";

export const metadata: Metadata = {
  title: "設定：食事とジャンル",
};

export default function MealsSettingsPage() {
  return (
    <SettingsHeading
      title="食事とジャンル"
      lead="昼食・夕食ごとに、どのジャンルのレシピを提案するかを決めます。ジャンルは、タイトルにふくまれる言葉で見分けます。"
    />
  );
}
