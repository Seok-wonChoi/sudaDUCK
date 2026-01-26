import Tag from "../../common/Tag";

export default function InfoGrid({ topic, participants = [] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">💬</span>
          <span className="text-xs font-semibold text-gray-500">대화 주제</span>
        </div>
        <div className="text-sm font-bold text-gray-900">{topic || "-"}</div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">👥</span>
          <span className="text-xs font-semibold text-gray-500">참여자</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {participants.length > 0 ? (
            participants.map((name, index) => (
              <Tag key={index} variant="participant">{name}</Tag>
            ))
          ) : (
            <span className="text-sm text-gray-400">-</span>
          )}
        </div>
      </div>
    </div>
  );
}
