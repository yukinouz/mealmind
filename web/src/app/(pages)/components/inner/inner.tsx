import { clsx } from "clsx";
import styles from "./_styles/_inner.module.scss";

interface InnerProps {
  children: React.ReactNode;
  variant?: "header" | "hero" | "default";
}

const Inner = ({ children, variant = "default" }: InnerProps) => {
  const className = clsx({
    [styles.header]: variant === "header",
    [styles.hero]: variant === "hero",
    [styles.inner]: variant === "default",
  });
  return <div className={className}>{children}</div>;
};

export { Inner };
