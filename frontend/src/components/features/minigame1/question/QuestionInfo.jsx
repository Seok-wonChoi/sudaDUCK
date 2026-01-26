export default function QuestionInfo({ current = 1, total = 8, score = 0 }) {
  return (
    <div className="flex items-center justify-between">
      <div className="py-1.5 px-3 bg-indigo-100 text-indigo-700 text-sm font-bold rounded-lg">
        문제 {current} / {total}
      </div>
      <div className="text-sm font-semibold text-emerald-600">정답: {score}</div>
    </div>
  );
}
