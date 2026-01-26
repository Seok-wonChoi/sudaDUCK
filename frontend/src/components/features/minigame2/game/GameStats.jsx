export default function GameStats({ current = 0, total = 10, timeLeft = 0 }) {
  return (
    <div className="flex items-center gap-2">
      <div className="py-1.5 px-3 bg-indigo-100 text-indigo-700 text-sm font-bold rounded-lg">
        <span>{current} / {total}</span>
      </div>
      <div className="py-1.5 px-3 bg-amber-100 text-amber-700 text-sm font-bold rounded-lg">
        <span>{timeLeft}초</span>
      </div>
    </div>
  );
}
