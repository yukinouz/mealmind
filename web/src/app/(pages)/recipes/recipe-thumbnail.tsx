"use client";

import Image from "next/image";
import { useState } from "react";

const NO_IMAGE_PATH = "/images/common/noimage.jpg";

// 画像の URL がないときや、読み込みに失敗したときは共通の画像を出す
export const RecipeThumbnail = ({ src }: { src: string | null }) => {
  const [hasError, setHasError] = useState(false);
  const isFallback = src === null || hasError;

  return (
    <Image
      src={isFallback ? NO_IMAGE_PATH : src}
      alt=""
      width={307}
      height={173}
      style={{ objectFit: "cover" }}
      onError={() => setHasError(true)}
    />
  );
};
