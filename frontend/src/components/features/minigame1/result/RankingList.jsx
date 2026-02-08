import RankingItem from './RankingItem';
import styles from './RankingList.module.css';

export default function RankingList({ rankings = [], totalQuestions = 4 }) {

  return (

    <div className={styles.list}>

      {rankings.map((player, idx) => {

        // 부모(MiniGame1Page)에서 이미 병합된 데이터를 그대로 사용

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

            isSpeaking={player.isSpeaking || false}

          />

        );

      })}

    </div>

  );

}
