import RankingItem from './RankingItem';
import styles from './RankingList.module.css';

export default function RankingList({ rankings = [], myProfile = null, totalQuestions = 4 }) {
  return (
    <div className={styles.list}>
      {rankings.map((player, idx) => {
        const isMe = player.isMe || player.me;

        // 내 정보면 myProfile, 남이면 mergedRankings에서 넣어준 player.duckCustomJson 사용
        const customJsonToUse = isMe && myProfile 
          ? myProfile.duckCustomJson 
          : player.duckCustomJson;

        return (
          <RankingItem
            key={player.nickname || idx}
            rank={idx + 1}
            nickname={player.nickname}
            profileImageUrl={player.profileImageUrl}
            duckCustomJson={customJsonToUse} // 👈 여기가 핵심
            score={player.score}
            total={totalQuestions}
            isMe={isMe}
          />
        );
      })}
    </div>
  );
}