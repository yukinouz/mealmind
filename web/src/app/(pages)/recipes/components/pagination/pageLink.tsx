"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

/** ページ送りのリンク。URL の ? 以降が変わるだけだとスクロール位置が残るので、移るときに画面のいちばん上へ戻す */
const PageLink = (props: ComponentProps<typeof Link>) => (
  <Link {...props} onNavigate={() => window.scrollTo({ top: 0 })} />
);

export { PageLink };
