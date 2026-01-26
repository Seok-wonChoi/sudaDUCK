import StatCard from "@/components/common/StatCard/StatCard";

export default function StatsSection({ stats }) {
  return (
    <section
      className="mt-5 sm:mt-[22px] grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-[18px] max-w-[980px] mx-auto"
      aria-label="학습 통계"
    >
      {stats.map((s) => (
        <StatCard key={s.label} value={s.value} label={s.label} />
      ))}
    </section>
  );
}
