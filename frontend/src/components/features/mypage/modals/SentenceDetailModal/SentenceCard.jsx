export default function SentenceCard({ english, korean, onPlayAudio }) {
  return (
    <div className="bg-gradient-to-br from-violet-100 to-fuchsia-100 rounded-2xl p-5">
      <div className="text-xs font-semibold text-gray-500 mb-1">영어 문장</div>
      <div className="text-lg font-bold text-gray-900 mb-4">{english}</div>

      <div className="text-xs font-semibold text-gray-500 mb-1">한글 해석</div>
      <div className="text-[15px] text-gray-700 mb-5">{korean}</div>

      <button
        type="button"
        className="w-full h-12 border-none rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600
          text-white text-[15px] font-bold cursor-pointer flex items-center justify-center gap-2
          hover:brightness-105"
        onClick={onPlayAudio}
      >
        <span className="text-lg">🔊</span>
        영어로 듣기
      </button>
    </div>
  );
}
