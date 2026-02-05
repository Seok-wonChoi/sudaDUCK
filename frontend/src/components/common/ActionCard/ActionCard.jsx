import styles from "./ActionCard.module.css";

export default function ActionCard({ title, description, iconSrc, iconAlt, onClick, variant = "default" }) {
  const cardClassName = `${styles.Card} ${variant === "make" ? styles.CardMake : ""}`;

  return (
    <button type="button" className={cardClassName} onClick={onClick}>
      <div className={styles.IconWrap}>
        <img className={styles.Icon} src={iconSrc} alt={iconAlt} />
      </div>

      <div className={styles.Title}>{title}</div>
      <div className={styles.Desc}>{description}</div>
    </button>
  );
}
