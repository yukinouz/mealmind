import type { Metadata } from "next";
import { ChannelSettings } from "../components/channelSettings/channelSettings";

export const metadata: Metadata = {
  title: "設定：チャンネル",
};

export default function ChannelsSettingsPage() {
  return <ChannelSettings />;
}
