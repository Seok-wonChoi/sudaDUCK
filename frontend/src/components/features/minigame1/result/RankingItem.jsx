export default function RankingItem({
  rank,
  name,
  avatar,
  score,
  total,
  isMe = false
}) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl
      ${isMe ? "bg-indigo-50 border border-indigo-200" : "bg-gray-50"}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
          {avatar ? (
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-200 to-indigo-300" />
          )}
        </div>
        <span className="font-semibold text-gray-900">{name}</span>
        {isMe && (
          <span className="py-0.5 px-2 bg-indigo-600 text-white text-xs font-bold rounded">
            YOU
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-lg font-bold text-indigo-600">{score}</span>
        <span className="text-sm text-gray-500">/ {total} 문제</span>
      </div>
    </div>
  );
}
