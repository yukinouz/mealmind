import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    // YouTube のサムネイル画像
    remotePatterns: [new URL("https://i.ytimg.com/vi/**")],
  },
  sassOptions: {
    loadPaths: [path.resolve(__dirname, "src/_styles")],
  },
};

export default nextConfig;
