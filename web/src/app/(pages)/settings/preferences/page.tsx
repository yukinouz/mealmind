import type { Metadata } from "next";
import { SettingsHeading } from "../components/settingsHeading/settingsHeading";

export const metadata: Metadata = {
  title: "設定：好み",
};

export default function PreferencesSettingsPage() {
  return (
    <SettingsHeading
      title="好み"
      lead="提案から外したい食材や言葉と、いつも家にある食材を登録します。"
    />
  );
}
