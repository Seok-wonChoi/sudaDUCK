import styles from "./StatsCard.module.css";

export default function StatsCard({ stats }) {
  const defaultStats = [
    { value: 0, label: "ì´??Œë ˆ???€??, unit: "" },
    { value: 0, label: "?°ì† ?™ìŠµ", unit: "?? },
    { value: 0, label: "?€?¥ëœ ë¬¸ì¥", unit: "ê°? },
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
