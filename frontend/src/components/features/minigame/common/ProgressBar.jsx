export default function ProgressBar({ current = 0, total = 100 }) {
  const percent = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="px-4 py-2">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
