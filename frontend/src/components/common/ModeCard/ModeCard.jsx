import duckImg from "@/assets/images/duck.png";

export default function ModeCard({ title, description, onClick, duckCount = 1 }) {
  const isDouble = duckCount === 2;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-[280px] sm:w-[300px] h-[280px] sm:h-[300px] border border-gray-100 bg-white rounded-2xl
        p-5 sm:p-6 cursor-pointer text-center shadow-lg
        flex flex-col items-center
        hover:border-indigo-100 hover:shadow-xl transition-all"
    >
      <div
        className="relative w-auto h-[140px] sm:h-[160px] grid place-items-center mt-2 mb-2.5"
        aria-hidden="true"
      >
        {isDouble ? (
          <div className="flex items-center justify-center -space-x-12">
            <img
              className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] object-contain block select-none pointer-events-none"
              src={duckImg}
              alt=""
              draggable="false"
            />
            <img
              className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] object-contain block select-none pointer-events-none"
              src={duckImg}
              alt=""
              draggable="false"
            />
          </div>
        ) : (
          <div className="grid place-items-center">
            <img
              className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] object-contain block select-none pointer-events-none"
              src={duckImg}
              alt=""
              draggable="false"
            />
          </div>
        )}

        <div className={`absolute right-5 top-2.5 text-4xl ${isDouble ? "right-0" : ""}`}>
          ✨
        </div>
      </div>

      <div className="mt-2.5 font-black text-xl sm:text-[22px] tracking-tight">{title}</div>
      <div className="mt-2.5 text-gray-500 text-xs sm:text-sm leading-relaxed max-w-[240px]">
        {description}
      </div>
    </button>
  );
}
