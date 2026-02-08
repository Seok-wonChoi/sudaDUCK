import styles from './LoadingOverlay.module.css';
import duckProfile3 from '@/assets/images/duck_profile3.png';

export default function LoadingOverlay({
  title = '?€?”ê? ì¢…ë£Œ?˜ì—ˆ?µë‹ˆ??',
  subtitle = '?ë„???°ìŠµ???„í•´ ?´ë™ ì¤‘ì…?ˆë‹¤...',
  note = '',
  image = duckProfile3
}) {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.subtitle}>{subtitle}</p>
        
        {note && (
          <div className={styles.noteContainer}>
            <p className={styles.note}>{note}</p>
          </div>
        )}
      </div>

      <img src={image} alt="Background Duck" className={styles.duck} />
    </div>
  );
}
