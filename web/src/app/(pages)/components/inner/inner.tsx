import styles from "./_styles/_inner.module.scss";

interface InnerProps {
  children: React.ReactNode;
}

const Inner = ({ children }: InnerProps) => {
  return <div className={styles.inner}>{children}</div>;
};

export { Inner };
