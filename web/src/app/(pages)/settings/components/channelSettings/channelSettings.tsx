import { connection } from "next/server";
import { readChannelSettings } from "@/lib/sources";
import { SettingsHeading } from "../settingsHeading/settingsHeading";
import { ChannelSettingsForm } from "./channelSettingsForm";

/** チャンネルの設定。/settings（PC 幅）と /settings/channels の両方に出す */
const ChannelSettings = async () => {
  // ビルドのときに読んだ値で固めず、開くたびに sources.json と動画一覧のキャッシュを読む
  await connection();
  const channels = await readChannelSettings();

  return (
    <>
      <SettingsHeading
        title="チャンネル"
        lead="レシピを提案するチャンネルと、それぞれから提案される割合を決めます。変更は「保存する」を押すまで反映されません。"
      />
      <ChannelSettingsForm initialChannels={channels} />
    </>
  );
};

export { ChannelSettings };
