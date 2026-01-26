export default function ActionCard({ title, description, iconSrc, iconAlt, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-[280px] sm:w-[300px] h-[280px] sm:h-[300px] border border-gray-100 bg-white rounded-2xl
        py-6 px-5 cursor-pointer text-center shadow-lg
        flex flex-col items-center justify-start
        hover:border-indigo-500/35 hover:shadow-xl transition-all"
    >
      <div
        className="w-[120px] sm:w-[140px] h-[120px] sm:h-[140px] mt-2.5 rounded-[20px]
          bg-indigo-500/[0.08] border border-indigo-500/[0.18]
          grid place-items-center"
      >
        <img
          className="w-20 sm:w-24 h-20 sm:h-24 object-contain block pointer-events-none select-none"
          src={iconSrc}
          alt={iconAlt}
        />
      </div>

      <div className="mt-[18px] font-black text-[22px] tracking-tight text-gray-900">
        {title}
      </div>
      <div className="mt-2.5 max-w-[240px] text-[13px] leading-relaxed text-gray-500">
        {description}
      </div>
    </button>
  );
}
