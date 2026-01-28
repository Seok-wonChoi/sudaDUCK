import styles from './SentenceCard.module.css';

export default function SentenceCard({
  number,
  text,
  rotation = 0,
  isRemoved = false,
  onClick,
  style = {}
}) {
  const handleClick = () => {
    if (!isRemoved && onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`${styles.card} ${isRemoved ? styles.removed : ''}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        ...style,
        cursor: !isRemoved && onClick ? 'pointer' : 'default'
      }}
      onClick={handleClick}
    >
      <span className={styles.number}>#{String(number).padStart(2, '0')}</span>
      <p className={styles.text}>{text}</p>
    </div>
  );
}
