import styles from "./PurchaseConfirmModal.module.css";
import coinImage from "@/assets/images/coin.png";

export default function PurchaseConfirmModal({
  itemName,
  cost,
  currentCoins,
  onConfirm,
  onCancel,
}) {
  const remainingCoins = currentCoins - cost;
  const canAfford = remainingCoins >= 0;

  return (
    <div className={styles.Overlay} onClick={onCancel}>
      <div className={styles.Modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.Header}>
          <h3 className={styles.Title}>?�이??구매</h3>
        </div>

        <div className={styles.Content}>
          <div className={styles.ItemName}>{itemName}</div>

          <div className={styles.CoinInfo}>
            <div className={styles.CoinRow}>
              <span className={styles.Label}>보유 코인</span>
              <div className={styles.CoinAmount}>
                <img src={coinImage} alt="코인" className={styles.CoinIcon} />
                <span className={styles.Amount}>{currentCoins}</span>
              </div>
            </div>

            <div className={styles.CoinRow}>
              <span className={styles.Label}>가�?/span>
              <div className={styles.CoinAmount}>
                <img src={coinImage} alt="코인" className={styles.CoinIcon} />
                <span className={styles.Amount}>-{cost}</span>
              </div>
            </div>

            <div className={styles.Divider} />

            <div className={styles.CoinRow}>
              <span className={styles.LabelBold}>구매 ???�액</span>
              <div className={`${styles.CoinAmount} ${!canAfford ? styles.Insufficient : ""}`}>
                <img src={coinImage} alt="코인" className={styles.CoinIcon} />
                <span className={styles.Amount}>{remainingCoins}</span>
              </div>
            </div>
          </div>

          {!canAfford && (
            <div className={styles.Warning}>
              코인??부족합?�다!
            </div>
          )}
        </div>

        <div className={styles.Footer}>
          <button
            type="button"
            className={styles.CancelBtn}
            onClick={onCancel}
          >
            취소
          </button>
          <button
            type="button"
            className={`${styles.ConfirmBtn} ${!canAfford ? styles.Disabled : ""}`}
            onClick={onConfirm}
            disabled={!canAfford}
          >
            구매?�기
          </button>
        </div>
      </div>
    </div>
  );
}
