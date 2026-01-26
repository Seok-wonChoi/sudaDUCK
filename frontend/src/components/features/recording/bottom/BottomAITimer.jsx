export default function BottomAITimer({ seconds = 3 }) {
  return (
    <div className="flex flex-col items-center gap-2 md:gap-3 p-4 md:p-5 lg:p-6" aria-live="polite">
      <p className="m-0 text-sm md:text-base font-bold text-gray-900 tracking-wide">
        AI가 문장을 읽기까지
      </p>
      <div className="text-4xl md:text-5xl lg:text-[56px] font-extrabold leading-none text-[#2b7fff] tabular-nums">
        {Math.max(0, seconds)}
      </div>
      <p className="m-0 text-xs md:text-sm text-gray-500 font-medium">
        잠시 후 AI 음성이 재생돼요
      </p>
    </div>
  );
}
