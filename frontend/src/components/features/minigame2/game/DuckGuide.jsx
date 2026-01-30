import styles from './DuckGuide.module.css';
import duckImg from '@/assets/images/duck_minigame.png';

export default function DuckGuide({
  message = '문장을 읽어서 카드를 없애보아요!!',
  visible = true
}) {
  if (!visible) return null;

  return (
    <div className={styles.guide}>
      <div className={styles.speechBubble}>
        <p className={styles.message}>{message}</p>
      </div>
      <img src={duckImg} alt="Duck" className={styles.duck} />
    </div>
  );
}
