import styles from './BottomAIPlaying.module.css';

export default function BottomAIPlaying() {
  return (
    <div className={styles.container} aria-live="polite">
      <div className={styles.row}>
        <div className={styles.dot} />
        <p className={styles.title}>AI ?Œì„± ?¬ìƒ ì¤?..</p>
      </div>

      <p className={styles.sub}>???¤ì? ???ë™?¼ë¡œ ?¹ìŒ ?¨ê³„ë¡??˜ì–´ê°€??</p>
    </div>
  );
}
