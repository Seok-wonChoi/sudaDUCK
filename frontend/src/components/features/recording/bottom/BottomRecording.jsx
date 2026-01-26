export default function BottomRecording({ onStop }) {
  return (
    <div className="flex flex-col gap-3 md:gap-4 items-center text-center p-4 md:p-5 lg:p-6" aria-live="polite">
      <p className="m-0 font-black text-sm md:text-base text-red-500 tracking-wide uppercase">
        녹음 중...
      </p>
      <p className="m-0 text-xs md:text-sm text-gray-500 font-medium">
        문장을 천천히 또박또박 따라 말해보세요.
      </p>

      <div
        className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-[400px] h-2 md:h-2.5 rounded-full
          bg-gradient-to-r from-red-500 via-amber-500 to-green-500
          opacity-90 shadow-[0_2px_8px_rgba(239,68,68,0.3)] animate-pulse"
      />

      <div className="flex gap-2 md:gap-3 mt-1">
        <button
          className="border-none bg-gradient-to-br from-red-500 to-red-600 text-white
            font-extrabold py-2.5 px-4 md:py-3 md:px-6 rounded-xl cursor-pointer text-xs md:text-sm
            shadow-[0_4px_6px_-1px_rgba(239,68,68,0.3)] transition-all
            hover:from-red-600 hover:to-red-700 hover:-translate-y-0.5
            hover:shadow-[0_8px_12px_-2px_rgba(239,68,68,0.4)]
            active:translate-y-0 active:shadow-[0_2px_4px_-1px_rgba(239,68,68,0.3)]"
          onClick={onStop}
        >
          정지
        </button>
      </div>
    </div>
  );
}
