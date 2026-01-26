import { useState } from "react";

export default function QuizSection({
  isOpen,
  onToggle,
  question,
  answer,
}) {
  const [userAnswer, setUserAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleCheck = () => {
    const normalized = userAnswer.trim().toLowerCase();
    const correctAnswer = answer?.toLowerCase() || "";
    setIsCorrect(normalized === correctAnswer);
    setShowResult(true);
  };

  const handleRetry = () => {
    setUserAnswer("");
    setShowResult(false);
    setIsCorrect(false);
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold text-gray-900">빈칸 퀴즈</span>
        <button
          type="button"
          className="py-1.5 px-3 border border-amber-300 rounded-lg bg-white
            text-xs font-bold text-amber-700 cursor-pointer hover:bg-amber-50"
          onClick={onToggle}
        >
          {isOpen ? "퀴즈 닫기" : "퀴즈 풀기"}
        </button>
      </div>

      {isOpen && question && (
        <div className="mt-4 pt-4 border-t border-amber-200">
          <div className="text-xs font-semibold text-gray-500 mb-2">빈칸을 채워보세요</div>
          <div className="text-[15px] font-medium text-gray-900 mb-4 leading-relaxed">{question}</div>

          <input
            type="text"
            className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm
              focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
              disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="빈칸에 들어갈 단어들을 입력하세요"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={showResult}
          />

          {showResult && (
            <div className={`mt-3 p-3 rounded-xl text-sm font-bold text-center
              ${isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
            >
              {isCorrect ? "정답입니다! 🎉" : `오답입니다. 정답: ${answer}`}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              className="flex-1 h-10 border-none rounded-xl bg-indigo-600 text-white
                text-sm font-bold cursor-pointer hover:bg-indigo-700
                disabled:bg-gray-300 disabled:cursor-not-allowed"
              onClick={handleCheck}
              disabled={showResult || !userAnswer.trim()}
            >
              ✓ 정답 확인
            </button>
            <button
              type="button"
              className="h-10 px-4 border border-gray-200 rounded-xl bg-white
                text-sm font-bold text-gray-700 cursor-pointer hover:bg-gray-50"
              onClick={handleRetry}
            >
              ↻ 다시하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
