import RankingItem from './RankingItem';
import styles from './RankingList.module.css';

export default function RankingList({ rankings = [], myProfile = null }) {
  return (
    <div className={styles.list}>
      {rankings.map((player, idx) => (
        <RankingItem
          key={player.nickname || idx}
          rank={idx + 1}
          nickname={player.nickname}
          profileImageUrl={player.profileImageUrl}
          score={player.score}
          total={4}
          isMe={player.me}
        />
      ))}
    </div>
  );
}
