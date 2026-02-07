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

      // 코인 효과음 재생
      if (!isMuted) {
        try {
          const audio = new Audio(coinSound);
          audio.volume = getEffectiveVolume(0.4);
          audio.play().catch(() => {});
        } catch (e) {
          console.warn('코인 효과음 재생 실패:', e);
        }
      }

      // 2.5초 후 페이드아웃 시작
      const fadeOutTimer = setTimeout(() => {
        setFadingOut(true);
      }, 2500);

      // 3초 후 즉시 종료 및 부모 상태 변경
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
          <img src={coinImage} alt="코인" className={styles.CoinImage} />
          <div className={styles.CoinGlow} />
        </div>
        <h2 className={styles.Title}>축하합니다! 🎉</h2>
        <p className={styles.Message}>
          1등으로 <span className={styles.CoinAmount}>코인</span>이 지급되었습니다!
        </p>
      </div>
    </div>
  );
}
