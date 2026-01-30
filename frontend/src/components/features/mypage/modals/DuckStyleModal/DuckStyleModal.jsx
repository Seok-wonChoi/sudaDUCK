import { useState } from "react";
import styles from "./DuckStyleModal.module.css";
import ModalWrapper from "@/components/features/mypage/common/ModalWrapper";
import PurchaseConfirmModal from "@/components/features/mypage/common/PurchaseConfirmModal";
import coinImage from "@/assets/images/coin.png";

import duckProfile1 from "@/assets/images/duck_profile1.png";
import duckProfile2 from "@/assets/images/duck_profile2.png";
import duckProfile3 from "@/assets/images/duck_profile3.png";
import duckProfile4 from "@/assets/images/duck_profile4.png";

const PROFILE_OPTIONS = [
  { id: "profile1", image: duckProfile1 },
  { id: "profile2", image: duckProfile2 },
  { id: "profile3", image: duckProfile3 },
  { id: "profile4", image: duckProfile4 },
];

const COLOR_OPTIONS = [
  { id: "white", color: "#ffffff", cost: 0 }, // 기본 무료
  { id: "yellow", color: "#fef08a", cost: 20 },
  { id: "blue", color: "#93c5fd", cost: 20 },
  { id: "pink", color: "#f9a8d4", cost: 20 },
  { id: "green", color: "#86efac", cost: 20 },
  { id: "purple", color: "#c4b5fd", cost: 20 },
  { id: "orange", color: "#fdba74", cost: 20 },
];

const ACCESSORY_OPTIONS = [
  { id: null, icon: "❌", label: "없음", cost: 0 }, // 기본 무료
  { id: "hat", icon: "🎩", label: "모자", cost: 20 },
  { id: "sunglasses", icon: "🕶️", label: "선글라스", cost: 20 },
  { id: "ribbon", icon: "🎀", label: "리본", cost: 20 },
  { id: "crown", icon: "👑", label: "왕관", cost: 20 },
];

export default function DuckStyleModal({
  currentProfileId = "profile1",
  currentColor = "yellow",
  currentAccessory = null,
  coins = 0,
  unlockedColors = [],
  unlockedAccessories = [],
  onPurchase,
  onSave,
  onClose,
}) {
  const [selectedProfileId, setSelectedProfileId] = useState(currentProfileId);
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [selectedAccessory, setSelectedAccessory] = useState(currentAccessory);
  const [purchaseModal, setPurchaseModal] = useState(null);

  const handleColorClick = (colorId, cost) => {
    if (unlockedColors.includes(colorId)) {
      setSelectedColor(colorId);
    } else {
      // 잠긴 색상 - 구매 확인 모달 표시
      const colorName = COLOR_OPTIONS.find((c) => c.id === colorId)?.id || "색상";
      setPurchaseModal({
        type: 'color',
        id: colorId,
        name: `${colorName.toUpperCase()} 색상`,
        cost,
      });
    }
  };

  const handleAccessoryClick = (accessoryId, cost) => {
    if (unlockedAccessories.includes(accessoryId)) {
      setSelectedAccessory(accessoryId);
    } else {
      // 잠긴 악세사리 - 구매 확인 모달 표시
      const accessoryName = ACCESSORY_OPTIONS.find((a) => a.id === accessoryId)?.label || "악세사리";
      setPurchaseModal({
        type: 'accessory',
        id: accessoryId,
        name: accessoryName,
        cost,
      });
    }
  };

  const handlePurchaseConfirm = () => {
    if (purchaseModal && onPurchase?.(purchaseModal.type, purchaseModal.id, purchaseModal.cost)) {
      if (purchaseModal.type === 'color') {
        setSelectedColor(purchaseModal.id);
      } else if (purchaseModal.type === 'accessory') {
        setSelectedAccessory(purchaseModal.id);
      }
    }
    setPurchaseModal(null);
  };

  const handleSave = () => {
    onSave?.({ profileId: selectedProfileId, color: selectedColor, accessory: selectedAccessory });
    onClose?.();
  };

  const selectedColorObj = COLOR_OPTIONS.find((c) => c.id === selectedColor);
  const selectedProfile = PROFILE_OPTIONS.find((p) => p.id === selectedProfileId);

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

      <ModalWrapper title="프로필 바꾸기" onClose={onClose} footer={footer}>
      <div className={styles.Content}>
        <div
          className={styles.Preview}
          style={{ backgroundColor: selectedColorObj?.color || "#fef08a" }}
        >
          <div className={styles.DuckWrapper}>
            <img
              src={selectedProfile?.image}
              alt="프로필 오리"
              className={styles.DuckImage}
            />
            {selectedAccessory && (
              <span className={styles.Accessory}>
                {ACCESSORY_OPTIONS.find((a) => a.id === selectedAccessory)?.icon}
              </span>
            )}
          </div>
        </div>

        <div className={styles.Section}>
          <h3 className={styles.SectionTitle}>프로필</h3>
          <div className={styles.ProfileGrid}>
            {PROFILE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`${styles.ProfileCard} ${
                  selectedProfileId === option.id ? styles.Selected : ""
                }`}
                onClick={() => setSelectedProfileId(option.id)}
              >
                <img
                  src={option.image}
                  alt={option.id}
                  className={styles.ProfileThumb}
                />
              </button>
            ))}
          </div>
        </div>

        <div className={styles.Section}>
          <h3 className={styles.SectionTitle}>색상</h3>
          <div className={styles.ColorsRow}>
            {COLOR_OPTIONS.map((option) => {
              const isUnlocked = unlockedColors.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.ColorButton} ${
                    selectedColor === option.id ? styles.Selected : ""
                  } ${!isUnlocked ? styles.Locked : ""}`}
                  style={{ backgroundColor: option.color }}
                  onClick={() => handleColorClick(option.id, option.cost)}
                  aria-label={option.id}
                >
                  {!isUnlocked && (
                    <div className={styles.LockOverlay}>
                      <span className={styles.LockIcon}>🔒</span>
                      <div className={styles.CoinPrice}>
                        <img src={coinImage} alt="코인" className={styles.CoinIconSmall} />
                        <span>{option.cost}</span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.Section}>
          <h3 className={styles.SectionTitle}>액세서리</h3>
          <div className={styles.AccessoriesRow}>
            {ACCESSORY_OPTIONS.map((option) => {
              const isUnlocked = unlockedAccessories.includes(option.id);
              return (
                <button
                  key={option.id || "none"}
                  type="button"
                  className={`${styles.AccessoryButton} ${
                    selectedAccessory === option.id ? styles.Selected : ""
                  } ${!isUnlocked ? styles.Locked : ""}`}
                  onClick={() => handleAccessoryClick(option.id, option.cost)}
                  title={option.label}
                >
                  {option.icon}
                  {!isUnlocked && (
                    <div className={styles.AccessoryLockBadge}>
                      <img src={coinImage} alt="코인" className={styles.CoinIconTiny} />
                      <span>{option.cost}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className={styles.AccessoryLabel}>
            {ACCESSORY_OPTIONS.find((a) => a.id === selectedAccessory)?.label || "없음"}
          </div>
        </div>
      </div>
    </ModalWrapper>
    </>
  );
}
