export default function WaitingPanel({
  message = '다른 플레이어를 기다리는 중...',
  subMessage = '잠시만 기다려주세요'
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-5">
      <div className="w-12 h-12 mb-4">
        <svg className="animate-spin text-indigo-600" viewBox="0 0 50 50">
          <circle
            className="opacity-25"
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
          />
          <circle
            className="opacity-75"
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray="80"
            strokeDashoffset="60"
          />
        </svg>
      </div>
      <p className="text-base font-bold text-gray-900 m-0 mb-1">{message}</p>
      <p className="text-sm text-gray-500 m-0">{subMessage}</p>
    </div>
  );
}
