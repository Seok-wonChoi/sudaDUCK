import { useEffect, useState } from 'react';
import styles from './CoinRewardNotification.module.css';
import coinImage from '@/assets/images/coin.png';
import coinSound from '@/assets/sounds/coin.mp3';
import { useSoundContext } from '@/context/SoundContext';

export default function CoinRewardNotification({ show, onComplete }) {
  const [active, setActive] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const { getEffectiveVolume, isMuted } = useSoundContext();

  useEffect(() => {
    if (show) {
      setActive(true);
      setFadingOut(false);

      // ì½”ì¸ ?¨ê³¼???¬ìƒ
      if (!isMuted) {
        try {
          const audio = new Audio(coinSound);
          audio.volume = getEffectiveVolume(0.4);
          audio.play().catch(() => {});
        } catch (e) {
          console.warn('ì½”ì¸ ?¨ê³¼???¬ìƒ ?¤íŒ¨:', e);
        }
      }

      // 2.5ì´????˜ì´?œì•„???œì‘
      const fadeOutTimer = setTimeout(() => {
        setFadingOut(true);
      }, 2500);

      // 3ì´???ì¦‰ì‹œ ì¢…ë£Œ ë°?ë¶€ëª??íƒœ ë³€ê²?
      const completeTimer = setTimeout(() => {
        setActive(false);
        if (onComplete) onComplete();
      }, 3000);

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(completeTimer);
      };
    } else {
      setActive(false);
      setFadingOut(false);
    }
  }, [show, isMuted, getEffectiveVolume, onComplete]);

  if (!active) return null;

  return (
    <div className={`${styles.OverlayReward} ${fadingOut ? styles.FadeOutReward : styles.FadeInReward}`}>
      <div className={styles.ContentReward}>
        <div className={styles.CoinContainer}>
          <img src={coinImage} alt="ì½”ì¸" className={styles.CoinImage} />
          <div className={styles.CoinGlow} />
        </div>
        <h2 className={styles.Title}>ì¶•í•˜?©ë‹ˆ?? ?‰</h2>
        <p className={styles.Message}>
          1?±ìœ¼ë¡?<span className={styles.CoinAmount}>ì½”ì¸</span>??ì§€ê¸‰ë˜?ˆìŠµ?ˆë‹¤!
        </p>
      </div>
    </div>
  );
}
