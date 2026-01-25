import RankingItem from './RankingItem';
import styles from './RankingList.module.css';

export default function RankingList({ rankings = [], currentUserId }) {
  return (
    <div className={styles.list}>
      {rankings.map((player, idx) => (
        <RankingItem
          key={player.id || idx}
          rank={idx + 1}
          name={player.name}
          avatar={player.avatar}
          score={player.score}
          total={player.total}
          isMe={player.id === currentUserId}
        />
      ))}
    </div>
  );
}
