export default function KoreanSentence({ sentence = '' }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-semibold text-gray-500">한국어</div>
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
        <p className="text-base text-gray-900 m-0 leading-relaxed">{sentence}</p>
      </div>
    </div>
  );
}
