import ReviewCard from './ReviewCard';

export default function ReviewPanel({ questions = [], onComplete }) {
  return (
    <div className="flex flex-col h-full">
      <div className="text-center py-5 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 m-0 mb-1">전체 문제 리뷰</h2>
        <p className="text-sm text-gray-500 m-0">맞춘 문제와 틀린 문제를 모두 확인해보세요</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {questions.map((q, idx) => (
          <ReviewCard
            key={idx}
            questionNumber={idx + 1}
            correctCount={q.correctCount}
            totalBlanks={q.totalBlanks}
            koreanSentence={q.koreanSentence}
            englishParts={q.englishParts}
            blanks={q.blanks}
          />
        ))}
      </div>

      <div className="p-4 border-t border-gray-200">
        <button
          className="w-full h-12 border-none rounded-xl bg-indigo-600
            text-white text-base font-bold cursor-pointer hover:bg-indigo-700"
          onClick={onComplete}
        >
          완료
        </button>
      </div>
    </div>
  );
}
