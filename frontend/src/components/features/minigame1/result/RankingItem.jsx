import styles from './RankingItem.module.css';

export default function RankingItem({
  rank,
  name,
  avatar,
  score,
  total,
  isMe = false
}) {
  return (
    <div className={`${styles.item} ${isMe ? styles.isMe : ''}`}>
      <div className={styles.left}>
        <div className={styles.avatar}>
          {avatar ? (
            <img src={avatar} alt={name} />
          ) : (
            <div className={styles.avatarPlaceholder} />
          )}
        </div>
        <span className={styles.name}>{name}</span>
        {isMe && <span className={styles.youBadge}>YOU</span>}
      </div>
      <div className={styles.right}>
        <span className={styles.score}>{score}</span>
        <span className={styles.total}>/ {total} 문제</span>
      </div>
    </div>
  );
}
