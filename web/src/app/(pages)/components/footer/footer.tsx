import { Inner } from "@/app/(pages)/components/inner/inner";
import styles from "./_styles/_footer.module.scss";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <Inner>
        <p className={styles.copyright}>
          &copy; {new Date().getFullYear()} yukinouz All rights reserved.
        </p>
      </Inner>
    </footer>
  );
};

export { Footer };
