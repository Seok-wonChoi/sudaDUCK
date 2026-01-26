export default function StatsCard({ stats }) {
  const defaultStats = [
    { value: 0, label: "총 플레이 타임", unit: "" },
    { value: 0, label: "연속 학습", unit: "일" },
    { value: 0, label: "저장된 문장", unit: "개" },
  ];

  const displayStats = stats || defaultStats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {displayStats.map((stat, index) => (
        <div
          key={index}
          className="py-5 px-4 text-center border-b sm:border-b-0 sm:border-r border-gray-200 last:border-b-0 last:border-r-0"
        >
          <div className="text-2xl font-black text-indigo-600">
            {stat.value}
            {stat.unit && <span className="text-base font-bold ml-0.5">{stat.unit}</span>}
          </div>
          <div className="mt-1 text-[13px] font-semibold text-gray-500">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
