import styles from './TurnTabs.module.css';

export default function TurnTabs({ currentTurn = 1 }) {
  const turns = [1, 2, 3];

  return (
    <div className={styles.turnTabs}>
      {turns.map((turn) => (
        <button
          key={turn}
          className={`${styles.tab} ${currentTurn === turn ? styles.active : ''}`}
        >
          Turn {turn}
        </button>
      ))}
    </div>
  );
}
