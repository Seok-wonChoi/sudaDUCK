import Tag from "../common/Tag";

export default function SentenceItem({ sentence, onClick, onDelete }) {
  const {
    english,
    korean,
    topic,
    score,
    needsReview,
    date,
    bookmarked = true,
  } = sentence;

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <div
      className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl
        cursor-pointer transition-all hover:border-indigo-200 hover:shadow-md"
      onClick={onClick}
    >
      <div className="shrink-0 text-xl text-indigo-600">
        {bookmarked ? (
          <span>☑️</span>
        ) : (
          <span className="text-gray-300">☐</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-bold text-gray-900 mb-1">{english}</div>
        <div className="text-sm text-gray-500 mb-2.5">{korean}</div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {topic && <Tag variant="topic">{topic}</Tag>}
            {score !== undefined && (
              <Tag variant="score">{score}점</Tag>
            )}
            {needsReview && <Tag variant="review">복습필요</Tag>}
          </div>
          {date && <div className="text-xs text-gray-400">{date}</div>}
        </div>
      </div>

      <button
        type="button"
        className="shrink-0 w-8 h-8 border-none bg-transparent cursor-pointer
          flex items-center justify-center rounded-lg opacity-50
          transition-all hover:opacity-100 hover:bg-red-50"
        onClick={handleDeleteClick}
        aria-label="삭제"
      >
        🗑️
      </button>
    </div>
  );
}
