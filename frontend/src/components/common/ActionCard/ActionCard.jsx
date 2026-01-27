import styles from "./ActionCard.module.css";

export default function ActionCard({ title, description, iconSrc, iconAlt, onClick }) {
  return (
    <button type="button" className={styles.Card} onClick={onClick}>
      <div className={styles.IconWrap}>
        <img className={styles.Icon} src={iconSrc} alt={iconAlt} />
      </div>

      <div className={styles.Title}>{title}</div>
      <div className={styles.Desc}>{description}</div>
    </button>
  );
}
