import { useState } from "react";
import styles from "./DuckBotModal.module.css";
import ModalWrapper from "@/components/features/mypage/common/ModalWrapper";
import PurchaseConfirmModal from "@/components/features/mypage/common/PurchaseConfirmModal";
import coinImage from "@/assets/images/coin.png";

import duckBotCyan from "@/assets/images/duck_bot_cyan.png";
import duckBotOrange from "@/assets/images/duck_bot_orange.png";
import duckBotDigital from "@/assets/images/duck_bot_digital.png";
import duckBotMecha from "@/assets/images/duck_bot_mecha.png";

const DUCK_OPTIONS = [
  { id: "cyan", label: "사이버", image: duckBotCyan, cost: 0 }, // 기본 무료
  { id: "orange", label: "아머", image: duckBotOrange, cost: 20 },
  { id: "digital", label: "디지털", image: duckBotDigital, cost: 20 },
  { id: "mecha", label: "메카", image: duckBotMecha, cost: 20 },
];

export default function DuckBotModal({
  currentDuckId = "cyan",
  coins = 0,
  unlockedDuckBots = [],
  onPurchase,
  onSave,
  onClose,
}) {
  const [selectedId, setSelectedId] = useState(currentDuckId);
  const [purchaseModal, setPurchaseModal] = useState(null);

  const selectedDuck = DUCK_OPTIONS.find((d) => d.id === selectedId);

  const handleDuckClick = (duckId, cost) => {
    if (unlockedDuckBots.includes(duckId)) {
      setSelectedId(duckId);
    } else {
      // 잠긴 오리봇 - 구매 확인 모달 표시
      const duckName = DUCK_OPTIONS.find((d) => d.id === duckId)?.label || "오리봇";
      setPurchaseModal({
        id: duckId,
        name: `${duckName} 오리봇`,
        cost,
      });
    }
  };

  const handlePurchaseConfirm = () => {
    if (purchaseModal && onPurchase?.('duckBot', purchaseModal.id, purchaseModal.cost)) {
      setSelectedId(purchaseModal.id);
    }
    setPurchaseModal(null);
  };

  const handleSave = () => {
    onSave?.(selectedId);
    onClose?.();
  };

  const footer = (
    <>
      <button type="button" className={styles.CancelBtn} onClick={onClose}>
        취소
      </button>
      <button type="button" className={styles.SaveBtn} onClick={handleSave}>
        저장
      </button>
    </>
  );

  return (
    <>
      {purchaseModal && (
        <PurchaseConfirmModal
          itemName={purchaseModal.name}
          cost={purchaseModal.cost}
          currentCoins={coins}
          onConfirm={handlePurchaseConfirm}
          onCancel={() => setPurchaseModal(null)}
        />
      )}

      <ModalWrapper title="AI오리봇 바꾸기" onClose={onClose} footer={footer}>
      <div className={styles.Content}>
        <div className={styles.Preview}>
          <img
            src={selectedDuck?.image}
            alt={selectedDuck?.label}
            className={styles.PreviewImage}
          />
        </div>

        <div className={styles.Grid}>
          {DUCK_OPTIONS.map((option) => {
            const isUnlocked = unlockedDuckBots.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                className={`${styles.DuckCard} ${
                  selectedId === option.id ? styles.Selected : ""
                } ${!isUnlocked ? styles.Locked : ""}`}
                onClick={() => handleDuckClick(option.id, option.cost)}
              >
                <div className={styles.DuckImageWrapper}>
                  <img
                    src={option.image}
                    alt={option.label}
                    className={styles.DuckThumb}
                  />
                  {!isUnlocked && (
                    <div className={styles.LockOverlay}>
                      <span className={styles.LockIcon}>🔒</span>
                      <div className={styles.CoinBadge}>
                        <img src={coinImage} alt="코인" className={styles.CoinIconSmall} />
                        <span>{option.cost}</span>
                      </div>
                    </div>
                  )}
                </div>
                <span className={styles.DuckLabel}>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </ModalWrapper>
    </>
  );
}
