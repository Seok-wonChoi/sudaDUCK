import styles from "./StatsCard.module.css";

export default function StatsCard({ stats }) {
  const defaultStats = [
    { value: 0, label: "총 플레이 타임", unit: "" },
    { value: 0, label: "연속 학습", unit: "일" },
    { value: 0, label: "저장된 문장", unit: "개" },
  ];

  const displayStats = stats || defaultStats;

  return (
    <div className={styles.Card}>
      {displayStats.map((stat, index) => (
        <div key={index} className={styles.StatItem}>
          <div className={styles.Value}>
            {stat.value}
            {stat.unit && <span className={styles.Unit}>{stat.unit}</span>}
          </div>
          <div className={styles.Label}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
