import styles from "./TipBanner.module.css";

export default function TipBanner({ text }) {
  return (
    <div className={styles.Banner} role="note" aria-label="팁">
      <span className={styles.Text}>{text}</span>
    </div>
  );
}
