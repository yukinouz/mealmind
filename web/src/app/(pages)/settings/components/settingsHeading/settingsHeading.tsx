import styles from "./_styles/_settingsHeading.module.scss";

interface SettingsHeadingProps {
  title: string;
  lead: string;
}

/** 設定の各ページの見出しと説明文 */
const SettingsHeading = ({ title, lead }: SettingsHeadingProps) => {
  return (
    <div className={styles.heading}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.lead}>{lead}</p>
    </div>
  );
};

export { SettingsHeading };
