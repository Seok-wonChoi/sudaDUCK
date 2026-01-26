export default function BlankDetail({ isCorrect, answer, userAnswer }) {
  if (isCorrect) {
    return (
      <div className="flex items-center gap-2 p-2 bg-emerald-100 rounded-lg">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          정답
        </span>
        <span className="text-sm font-semibold text-emerald-800">{answer}</span>
      </div>
    );
  }

  return (
    <div className="p-2 bg-red-100 rounded-lg">
      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 mb-2">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        오답
      </span>
      <div className="flex gap-4">
        <div>
          <span className="text-xs text-gray-500 block">내 답변</span>
          <span className="text-sm font-semibold text-red-700">{userAnswer || '(입력하지 않음)'}</span>
        </div>
        <div>
          <span className="text-xs text-gray-500 block">정답</span>
          <span className="text-sm font-semibold text-emerald-700">{answer}</span>
        </div>
      </div>
    </div>
  );
}
