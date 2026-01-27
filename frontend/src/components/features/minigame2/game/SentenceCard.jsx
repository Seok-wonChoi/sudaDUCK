import styles from './SentenceCard.module.css';

export default function SentenceCard({
  number,
  text,
  rotation = 0,
  isRemoved = false,
  style = {}
}) {
  return (
    <div
      className={`${styles.card} ${isRemoved ? styles.removed : ''}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        ...style
      }}
    >
      <span className={styles.number}>#{String(number).padStart(2, '0')}</span>
      <p className={styles.text}>{text}</p>
    </div>
  );
}
