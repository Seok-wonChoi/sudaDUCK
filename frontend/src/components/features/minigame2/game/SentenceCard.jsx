export default function SentenceCard({
  number,
  text,
  rotation = 0,
  isRemoved = false,
  style = {}
}) {
  return (
    <div
      className={`absolute w-[140px] sm:w-[180px] bg-white rounded-xl p-3 shadow-lg
        border border-gray-100 transition-all duration-500
        ${isRemoved ? "opacity-0 scale-75 pointer-events-none" : "opacity-100 scale-100"}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        ...style
      }}
    >
      <span className="text-xs font-bold text-indigo-600 mb-1 block">
        #{String(number).padStart(2, '0')}
      </span>
      <p className="text-xs sm:text-sm text-gray-900 m-0 leading-relaxed">{text}</p>
    </div>
  );
}
