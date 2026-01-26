export default function ParticipantList({ participants = [] }) {
  return (
    <div className="py-3 px-4 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-2">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L9 5L13 5.5L10 8.5L11 13L7 11L3 13L4 8.5L1 5.5L5 5L7 1Z" fill="#facc15"/>
        </svg>
        <span>참여자</span>
      </div>
      <div className="flex gap-4 overflow-x-auto">
        {participants.map((p, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            <div className={`relative w-10 h-10 rounded-full overflow-hidden
              ${p.isActive ? "ring-2 ring-green-500 ring-offset-2" : "opacity-50"}`}
            >
              {p.avatar ? (
                <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-200 to-indigo-300" />
              )}
              <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full flex items-center justify-center
                ${p.isActive ? "bg-green-500 text-white" : "bg-gray-400 text-white"}`}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 1V6M5 6C3.89543 6 3 5.10457 3 4M5 6C6.10457 6 7 5.10457 7 4M2 4V5C2 6.65685 3.34315 8 5 8C6.65685 8 8 6.65685 8 5V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <span className="text-xs font-medium text-gray-700">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
