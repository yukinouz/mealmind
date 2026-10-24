import { SettingsHeading } from "../settingsHeading/settingsHeading";

/** チャンネルの設定。/settings（PC 幅）と /settings/channels の両方に出す */
const ChannelSettings = () => {
  return (
    <SettingsHeading
      title="チャンネル"
      lead="レシピを提案するチャンネルと、それぞれから提案される割合を決めます。変更は「保存する」を押すまで反映されません。"
    />
  );
};

export { ChannelSettings };
