import BlankDetail from './BlankDetail';

export default function ReviewCard({
  questionNumber,
  correctCount,
  totalBlanks,
  koreanSentence,
  englishParts,
  blanks
}) {
  const isAllCorrect = correctCount === totalBlanks;

  return (
    <div className={`rounded-xl p-4 ${isAllCorrect ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1 py-1 px-2 rounded text-xs font-bold
          ${isAllCorrect ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
        >
          {isAllCorrect ? (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {correctCount}/{totalBlanks} 정답
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {correctCount}/{totalBlanks} 오답
            </>
          )}
        </span>
        <span className="text-xs font-semibold text-gray-500">문제 #{questionNumber}</span>
      </div>

      <div className="mb-3">
        <span className="text-xs font-semibold text-gray-500 mb-1 block">한국어 의미</span>
        <p className="text-sm text-gray-900 m-0">{koreanSentence}</p>
      </div>

      <div className="mb-3">
        <span className="text-xs font-semibold text-gray-500 mb-1 block">완성된 영어 문장</span>
        <div className="text-sm text-gray-900 leading-loose">
          {englishParts.map((part, idx) => (
            <span key={idx}>
              {part}
              {idx < blanks.length && (
                <span className={`inline-block mx-1 px-1.5 py-0.5 rounded font-semibold
                  ${blanks[idx].isCorrect ? "bg-emerald-200 text-emerald-800" : "bg-red-200 text-red-800"}`}
                >
                  {blanks[idx].answer}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      <div>
        <span className="text-xs font-semibold text-gray-500 mb-2 block">빈칸 상세</span>
        <div className="flex flex-col gap-2">
          {blanks.map((blank, idx) => (
            <BlankDetail
              key={idx}
              isCorrect={blank.isCorrect}
              answer={blank.answer}
              userAnswer={blank.userAnswer}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
