import type { Metadata } from "next";
import { connection } from "next/server";
import { readSuggestSettings } from "@/lib/settings";
import { toSuggestForm } from "@/utils/suggestSettings";
import { SettingsHeading } from "../components/settingsHeading/settingsHeading";
import { SuggestSettingsForm } from "../components/suggestSettings/suggestSettingsForm";

export const metadata: Metadata = {
  title: "設定：提案のしかた",
};

export default async function SuggestSettingsPage() {
  // ビルドのときに読んだ値で固めず、開くたびに settings.json を読む
  await connection();
  const settings = await readSuggestSettings();

  return (
    <>
      <SettingsHeading
        title="提案のしかた"
        lead="一度「作る」を選んだレシピを、どのくらい提案に混ぜるかを決めます。"
      />
      <SuggestSettingsForm initial={toSuggestForm(settings)} />
    </>
  );
}
