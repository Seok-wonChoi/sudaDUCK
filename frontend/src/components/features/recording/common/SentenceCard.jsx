export default function SentenceCard({
  speaker = '나',
  currentSentence = 1,
  totalSentences = 3,
  korean = '나는 카페에서 아르바이트를 했는데, 정말 힘들었어요.',
  english = 'I worked at a coffee shop, and it was really tough.',
  showRecordingBox = false,
  recordingContent = null,
  isAIPlaying = false
}) {
  return (
    <div
      className="bg-white border border-gray-200 rounded-2xl md:rounded-3xl shadow-lg
        p-5 sm:p-6 md:p-8 max-w-[900px] mx-auto transition-shadow hover:shadow-xl"
    >
      <div className="flex justify-between items-center flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 md:w-12 md:h-12 bg-[#2b7fff] rounded-full
              flex items-center justify-center shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 10C12.21 10 14 8.21 14 6C14 3.79 12.21 2 10 2C7.79 2 6 3.79 6 6C6 8.21 7.79 10 10 10ZM10 12C7.33 12 2 13.34 2 16V18H18V16C18 13.34 12.67 12 10 12Z" fill="white"/>
            </svg>
          </div>
          <span className="font-semibold text-lg md:text-xl text-gray-900">{speaker}</span>
        </div>
        <span className="font-medium text-sm md:text-base text-gray-500 whitespace-nowrap">
          {currentSentence} / {totalSentences}
        </span>
      </div>

      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-[13px] text-gray-500">한국어</span>
          <p className="text-sm md:text-base leading-relaxed text-gray-900 m-0">{korean}</p>
        </div>

        <div className="flex flex-col gap-2 bg-blue-50 p-3.5 sm:p-4 md:p-5 rounded-2xl mt-1 md:mt-2">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-[13px] text-[#2b7fff]">English</span>
            {isAIPlaying && (
              <span className="flex items-center gap-1.5 text-[13px] text-[#2b7fff] font-medium">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8h4l3-6 3 12 3-6h3" stroke="#2B7FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                AI 읽는 중...
              </span>
            )}
          </div>
          <p className="text-[15px] md:text-lg leading-relaxed text-gray-900 m-0">{english}</p>
        </div>

        {showRecordingBox && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 sm:p-4 md:p-5 min-h-[120px] flex flex-col gap-3">
            <span className="font-semibold text-[13px] text-gray-500">내 발음 녹음하기</span>
            <div className="flex flex-col items-center justify-center flex-1 py-5">
              {recordingContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
