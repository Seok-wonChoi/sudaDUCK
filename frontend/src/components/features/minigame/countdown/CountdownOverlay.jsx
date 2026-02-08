import styles from './CountdownOverlay.module.css';
import duckImg from '@/assets/images/duck_minigame_go.png';

export default function CountdownOverlay({
  count = 3,
  title = 'ì¤€ë¹„ë˜?¨ë‚˜??',
  subtitle = '?Œë§?€ ?¨ì–´ë¡?ë¹ˆì¹¸??ì±„ìš°?¸ìš”!'
}) {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.speechBubble}>
          <p className={styles.title}>{title}</p>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.countCircle}>
          <span className={styles.countNumber}>{count}</span>
        </div>
      </div>

      <img src={duckImg} alt="Duck" className={styles.duck} />
    </div>

  );
}
