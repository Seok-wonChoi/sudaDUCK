import RankingItem from './RankingItem';

export default function RankingList({ rankings = [], currentUserId }) {
  return (
    <div className="flex flex-col gap-2">
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
