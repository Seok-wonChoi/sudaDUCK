import styles from './RankingItem.module.css';

export default function RankingItem({
  rank,
  nickname,
  profileImageUrl,
  score,
  total = 4,
  isMe = false
}) {
  // 순위에 따른 메달 이모지
  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const rankIcon = getRankIcon(rank);

  // 프로필 이미지가 null이면 기본 회색 원
  const getProfileImage = () => {
    if (profileImageUrl) {
      return <img src={profileImageUrl} alt={nickname} className={styles.avatarImage} />;
    }
    return <div className={styles.avatarPlaceholder} />;
  };

  return (
    <div className={`${styles.item} ${isMe ? styles.isMe : ''}`}>
      {/* 왼쪽: 메달 */}
      <div className={styles.rankIcon}>
        {rankIcon ? (
          <span className={styles.medal}>{rankIcon}</span>
        ) : (
          <span className={styles.rankNumber}>{rank}</span>
        )}
      </div>

      {/* 중앙: 프로필 + 이름 */}
      <div className={styles.userInfo}>
        <div className={styles.avatar}>
          {getProfileImage()}
        </div>
        <div className={styles.nameContainer}>
          <span className={styles.nickname}>{nickname}</span>
          {isMe && <span className={styles.youBadge}>YOU</span>}
        </div>
      </div>

      {/* 오른쪽: 점수 */}
      <div className={styles.score}>
        <span className={styles.scoreNumber}>{score}</span>
        <span className={styles.scoreTotal}>/ {total}</span>
      </div>
    </div>
  );
}
