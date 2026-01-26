export default function StatCard({ value, label }) {
  return (
    <div
      className="bg-white/[0.78] border border-gray-100/90 rounded-2xl
        py-5 sm:py-[22px] px-4 sm:px-[18px] text-center
        shadow-lg backdrop-blur-sm"
    >
      <div className="text-2xl sm:text-[28px] font-black tracking-tight text-indigo-600">
        {value}
      </div>
      <div className="mt-2.5 text-sm text-gray-500 font-semibold">
        {label}
      </div>
    </div>
  );
}
