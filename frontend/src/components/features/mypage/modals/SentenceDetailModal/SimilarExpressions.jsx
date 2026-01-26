export default function SimilarExpressions({ expressions = [] }) {
  if (expressions.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">💡</span>
        <span className="text-[15px] font-bold text-gray-900">비슷한 표현들</span>
      </div>

      <div className="flex flex-col gap-2">
        {expressions.map((expr, index) => (
          <div key={index} className="bg-white rounded-xl p-3">
            <div className="text-sm font-semibold text-gray-900 mb-1">{expr.english}</div>
            <div className="text-xs text-gray-500">{expr.korean}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
