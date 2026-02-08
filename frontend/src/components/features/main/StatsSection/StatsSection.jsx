import styles from "./StatsSection.module.css";
import StatCard from "@/components/common/StatCard/StatCard";

export default function StatsSection({ stats }) {
  return (
    <section className={styles.Section} aria-label="?™ìŠµ ?µê³„">
      {stats.map((s) => (
        <StatCard key={s.label} value={s.value} label={s.label} />
      ))}
    </section>
  );
}
