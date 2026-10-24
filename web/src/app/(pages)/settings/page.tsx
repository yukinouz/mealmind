import type { Metadata } from "next";
import mediaDisplay from "@/_styles/_mediaDisplay.module.scss";
import { ChannelSettings } from "./components/channelSettings/channelSettings";
import { SettingsListMenu } from "./components/settingsMenu/settingsListMenu";

export const metadata: Metadata = {
  title: "設定",
};

// 画面幅でリダイレクトはできないので、スマホ幅はメニューだけ、PC 幅はチャンネルのページを CSS で出し分ける
export default function SettingsPage() {
  return (
    <>
      <div className={mediaDisplay.spShow}>
        <SettingsListMenu />
      </div>
      <div className={mediaDisplay.pcShow}>
        <ChannelSettings />
      </div>
    </>
  );
}
