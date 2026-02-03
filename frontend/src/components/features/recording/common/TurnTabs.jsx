import styles from './TurnTabs.module.css';

export default function TurnTabs({
  currentTurn = 1,
  totalTurns = 3,
  isAllDone = false,
  onTurnClick = null,
  selectedTurnForReport = null
}) {
  const turns = Array.from({ length: totalTurns }, (_, i) => i + 1);

  const handleClick = (turn) => {
    if (isAllDone && onTurnClick) {
      onTurnClick(turn);
    }
  };

  return (
    <div className={styles.turnTabs}>
      {turns.map((turn) => {
        const isActive = selectedTurnForReport !== null
          ? selectedTurnForReport === turn
          : currentTurn === turn;

        return (
          <button
            key={turn}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            onClick={() => handleClick(turn)}
            style={{ cursor: isAllDone ? 'pointer' : 'default' }}
          >
            Turn {turn}
          </button>
        );
      })}
    </div>
  );
}
