import styles from "./ActionCard.module.css";
import tapSound from "@/assets/sounds/tap.wav";
import { useSoundContext } from "@/context/SoundContext";

export default function ActionCard({ title, description, iconSrc, iconAlt, onClick, variant = "default" }) {
  const cardClassName = `${styles.Card} ${variant === "make" ? styles.CardMake : ""}`;
  const { getEffectiveVolume, isMuted } = useSoundContext();

  const playTapSound = () => {
    if (isMuted) return;
    try {
      const audio = new Audio(tapSound);
      audio.volume = getEffectiveVolume(0.1);
      audio.play().catch(() => {});
    } catch (e) {
      // 사운드 재생 실패 무시
    }
  };

  return (
    <button type="button" className={cardClassName} onClick={onClick} onMouseEnter={playTapSound}>
      <div className={styles.IconWrap}>
        <img className={styles.Icon} src={iconSrc} alt={iconAlt} />
      </div>

      <div className={styles.Title}>{title}</div>
      <div className={styles.Desc}>{description}</div>
    </button>
  );
}
