import SentenceItem from "./SentenceItem";

export default function SentenceList({ sentences = [], onItemClick, onDelete }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🔖</span>
        <h2 className="text-lg font-extrabold text-gray-900 m-0">저장한 영어 문장</h2>
      </div>

      <div className="flex flex-col gap-3">
        {sentences.length === 0 ? (
          <div className="py-10 px-5 text-center text-gray-400 text-sm">
            저장된 문장이 없습니다.
          </div>
        ) : (
          sentences.map((sentence) => (
            <SentenceItem
              key={sentence.id}
              sentence={sentence}
              onClick={() => onItemClick?.(sentence)}
              onDelete={() => onDelete?.(sentence.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
