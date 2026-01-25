import styles from "./NicknameBadge.module.css";

const BACKGROUND_STYLES = {
  default: styles.bgDefault,
  gradient: styles.bgGradient,
  ocean: styles.bgOcean,
  neon: styles.bgNeon,
  gold: styles.bgGold,
  rainbow: styles.bgRainbow,
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
    <div className={`${styles.Badge} ${bgClass}`}>
      {effect && EFFECTS[effect] && (
        <span className={styles.Effect}>{EFFECTS[effect]}</span>
      )}
      <span className={styles.Nickname}>{nickname}</span>
      {effect && EFFECTS[effect] && (
        <span className={styles.Effect}>{EFFECTS[effect]}</span>
      )}
    </div>
  );
}
