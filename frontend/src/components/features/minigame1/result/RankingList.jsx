import RankingItem from './RankingItem';
import styles from './RankingList.module.css';

export default function RankingList({ rankings = [], totalQuestions = 4 }) {

  return (

    <div className={styles.list}>

      {rankings.map((player, idx) => {

        // ë¶€ëª?MiniGame1Page)?ì„œ ?´ë? ë³‘í•©???°ì´?°ë? ê·¸ë?ë¡??¬ìš©

        const customJsonToUse = player.duckCustomJson;



        return (

          <RankingItem
            key={player.userId || player.nickname || idx}
            rank={idx + 1}
            nickname={player.nickname}
            profileImageUrl={player.profileImageUrl}
            duckCustomJson={customJsonToUse}
            score={player.score}
            total={totalQuestions}
            isMe={player.isMe}
          />

        );

      })}

    </div>

  );

}
