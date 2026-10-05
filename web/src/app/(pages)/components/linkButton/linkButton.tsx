import Link from "next/link";
import styles from "./_styles/_linkButton.module.scss";

interface LinkButtonProps {
  href: string;
  text: string;
}

const LinkButton = ({ href, text }: LinkButtonProps) => {
  return (
    <Link className={styles.linkButton} href={href}>
      {text}
    </Link>
  );
};

export { LinkButton };
