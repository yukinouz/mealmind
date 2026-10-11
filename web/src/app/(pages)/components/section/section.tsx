import { clsx } from "clsx";
import styles from "./_styles/_section.module.scss";

interface SectionProps {
  children: React.ReactNode;
  top?: boolean;
  bottom?: boolean;
}

const Section = ({ children, top, bottom }: SectionProps) => {
  const className = clsx({ [styles.top]: top, [styles.bottom]: bottom });

  return <section className={className}>{children}</section>;
};

export { Section };
