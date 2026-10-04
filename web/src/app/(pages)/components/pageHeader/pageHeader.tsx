import styles from "./_styles/_pageHeader.module.scss";

interface PageHeaderProps {
  title: string;
}

const PageHeader = ({ title }: PageHeaderProps) => {
  return <h1 className={styles.title}>{title}</h1>;
};

export { PageHeader };
