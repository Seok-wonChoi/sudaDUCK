import styles from "./StatsSection.module.css";
import StatCard from "../StatCard/StatCard";

export default function StatsSection({ stats }) {
  return (
    <section className={styles.Section} aria-label="학습 통계">
      {stats.map((s) => (
        <StatCard key={s.label} value={s.value} label={s.label} />
      ))}
    </section>
  );
}
