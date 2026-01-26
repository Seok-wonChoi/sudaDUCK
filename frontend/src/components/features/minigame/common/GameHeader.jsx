export default function GameHeader({
  title = '빈칸 채우기',
  timer = '0:00',
  badge = 'MINI 2'
}) {
  return (
    <div className="flex items-center justify-between py-4 px-5 bg-white border-b border-gray-200">
      <div className="py-1 px-2.5 bg-indigo-600 text-white text-xs font-bold rounded-md">
        {badge}
      </div>
      <h1 className="text-base font-bold text-gray-900 m-0">{title}</h1>
      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-600">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8 4V8L11 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span>{timer}</span>
      </div>
    </div>
  );
}
