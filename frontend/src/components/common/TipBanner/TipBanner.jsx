export default function TipBanner({ text }) {
  return (
    <div
      className="max-w-[760px] mx-auto bg-white/[0.92] border border-gray-200
        rounded-xl shadow-lg py-3.5 px-4 sm:px-[18px] text-center"
      role="note"
      aria-label="팁"
    >
      <span className="text-sm font-extrabold text-gray-700">{text}</span>
    </div>
  );
}
