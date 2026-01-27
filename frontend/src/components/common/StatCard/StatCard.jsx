import styles from "./StatCard.module.css";

export default function StatCard({ value, label }) {
  return (
    <div className={styles.Card}>
      <div className={styles.Value}>{value}</div>
      <div className={styles.Label}>{label}</div>
    </div>
  );
}
