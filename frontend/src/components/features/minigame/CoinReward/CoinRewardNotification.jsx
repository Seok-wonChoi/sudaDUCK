import { useEffect, useState } from 'react';
import styles from './CoinRewardNotification.module.css';
import coinImage from '@/assets/images/coin.png';

export default function CoinRewardNotification({ show, onComplete, coins = 100 }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      // 즉시 표시
      setIsVisible(true);

      // 3초 후 페이드아웃 시작
      const fadeOutTimer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);

      // 3.5초 후 완전히 제거
      const completeTimer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 3500);

      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className={`${styles.Overlay} ${isVisible ? styles.FadeIn : styles.FadeOut}`}>
      <div className={styles.Content}>
        <div className={styles.CoinContainer}>
          <img src={coinImage} alt="코인" className={styles.CoinImage} />
          <div className={styles.CoinGlow} />
        </div>
        <h2 className={styles.Title}>축하합니다! 🎉</h2>
        <p className={styles.Message}>
          1등으로 <span className={styles.CoinAmount}>{coins} 코인</span>이 지급되었습니다!
        </p>
      </div>
    </div>
  );
}
