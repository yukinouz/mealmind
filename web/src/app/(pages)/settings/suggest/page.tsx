import type { Metadata } from "next";
import { SettingsHeading } from "../components/settingsHeading/settingsHeading";

export const metadata: Metadata = {
  title: "設定：提案のしかた",
};

export default function SuggestSettingsPage() {
  return (
    <SettingsHeading
      title="提案のしかた"
      lead="一度「作る」を選んだレシピを、どのくらい提案に混ぜるかを決めます。"
    />
  );
}
