const BACKGROUND_STYLES = {
  default: "bg-white text-gray-900 border border-gray-200",
  gradient: "bg-gradient-to-r from-purple-400 to-pink-400 text-white",
  ocean: "bg-gradient-to-r from-cyan-500 to-blue-500 text-white",
  neon: "bg-black text-green-500 border-2 border-green-500 [text-shadow:0_0_10px_#22c55e]",
  gold: "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.2)]",
  rainbow: "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-violet-500 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]",
};

const EFFECTS = {
  sparkle: "✨",
  star: "⭐",
  fire: "🔥",
  crown: "👑",
};

export default function NicknameBadge({ nickname, style = {} }) {
  const { background = "gradient", effect = null } = style;
  const bgClass = BACKGROUND_STYLES[background] || BACKGROUND_STYLES.default;

  return (
    <div className={`inline-flex items-center gap-1.5 py-2 px-5 rounded-full text-lg font-extrabold ${bgClass}`}>
      {effect && EFFECTS[effect] && (
        <span className="text-sm">{EFFECTS[effect]}</span>
      )}
      <span>{nickname}</span>
      {effect && EFFECTS[effect] && (
        <span className="text-sm">{EFFECTS[effect]}</span>
      )}
    </div>
  );
}
