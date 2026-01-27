import SentenceCard from './SentenceCard';
import styles from './CardBoard.module.css';

// 카드 위치 및 회전 각도 사전 정의
const CARD_POSITIONS = [
  { top: '35%', left: '65%', rotation: 5 },
  { top: '50%', left: '55%', rotation: -3 },
  { top: '25%', left: '40%', rotation: -8 },
  { top: '15%', left: '55%', rotation: 12 },
  { top: '10%', left: '70%', rotation: -15 },
  { top: '55%', left: '25%', rotation: -90 },
  { top: '45%', left: '38%', rotation: 8 },
  { top: '5%', left: '20%', rotation: -5 },
  { top: '60%', left: '48%', rotation: 3 },
  { top: '30%', left: '15%', rotation: -85 },
];

export default function CardBoard({ cards = [], removedCards = [] }) {
  return (
    <div className={styles.board}>
      {cards.map((card, idx) => {
        const position = CARD_POSITIONS[idx % CARD_POSITIONS.length];
        return (
          <SentenceCard
            key={card.id}
            number={card.id}
            text={card.text}
            rotation={position.rotation}
            isRemoved={removedCards.includes(card.id)}
            style={{
              top: position.top,
              left: position.left,
            }}
          />
        );
      })}
    </div>
  );
}
