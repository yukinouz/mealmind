import type { Metadata } from "next";
import { connection } from "next/server";
import { readPreferenceLists } from "@/lib/preferences";
import { PreferenceSettingsForm } from "../components/preferenceSettings/preferenceSettingsForm";
import { SettingsHeading } from "../components/settingsHeading/settingsHeading";

export const metadata: Metadata = {
  title: "設定：好み",
};

export default async function PreferencesSettingsPage() {
  // ビルドのときに読んだ値で固めず、開くたびに preferences.json を読む
  await connection();
  const lists = await readPreferenceLists();

  return (
    <>
      <SettingsHeading
        title="好み"
        lead="提案から外したい食材や言葉と、いつも家にある食材を登録します。"
      />
      <PreferenceSettingsForm initial={lists} />
    </>
  );
}
