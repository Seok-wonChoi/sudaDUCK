import { useState } from "react";
import styles from "./NicknameStyleModal.module.css";
import ModalWrapper from "@/components/features/mypage/common/ModalWrapper";
import NicknameBadge from "@/components/features/mypage/ProfileSection/NicknameBadge";
import PurchaseConfirmModal from "@/components/features/mypage/common/PurchaseConfirmModal";
import coinImage from "@/assets/images/coin.png";

const BACKGROUND_OPTIONS = [
  { id: "default", label: "기본", cost: 0 }, // 기본 무료
  { id: "gradient", label: "그라데이션", cost: 10 },
  { id: "ocean", label: "바다", cost: 10 },
  { id: "neon", label: "네온", cost: 10 },
  { id: "gold", label: "골드", cost: 10 },
  { id: "rainbow", label: "레인보우", cost: 10 },
];

const EFFECT_OPTIONS = [
  { id: "none", icon: "❌", label: "없음", cost: 0 }, // 기본 무료
  { id: "sparkle", icon: "✨", label: "반짝임", cost: 10 },
  { id: "star", icon: "⭐", label: "별", cost: 10 },
  { id: "fire", icon: "🔥", label: "불꽃", cost: 10 },
  { id: "crown", icon: "👑", label: "왕관", cost: 10 },
];

export default function NicknameStyleModal({
  nickname = "example",
  currentStyle = {},
  coins = 0,
  unlockedBackgrounds = [],
  unlockedEffects = [],
  onPurchase,
  onSave,
  onClose,
}) {
  const [editedNickname, setEditedNickname] = useState(nickname);
  const [selectedBg, setSelectedBg] = useState(currentStyle.background || "default");
  const [selectedEffect, setSelectedEffect] = useState(currentStyle.effect || "none");
  const [purchaseModal, setPurchaseModal] = useState(null);

  const handleBackgroundClick = (bgId, cost) => {
    if (unlockedBackgrounds.includes(bgId)) {
      setSelectedBg(bgId);
    } else {
      // 잠긴 배경 - 구매 확인 모달 표시
      const bgName = BACKGROUND_OPTIONS.find((b) => b.id === bgId)?.label || "배경";
      setPurchaseModal({
        type: 'background',
        id: bgId,
        name: bgName,
        cost,
      });
    }
  };

  const handleEffectClick = (effectId, cost) => {
    if (unlockedEffects.includes(effectId)) {
      setSelectedEffect(effectId);
    } else {
      // 잠긴 효과 - 구매 확인 모달 표시
      const effectName = EFFECT_OPTIONS.find((e) => e.id === effectId)?.label || "효과";
      setPurchaseModal({
        type: 'effect',
        id: effectId,
        name: effectName,
        cost,
      });
    }
  };

  const handlePurchaseConfirm = () => {
    if (purchaseModal && onPurchase?.(purchaseModal.type, purchaseModal.id, purchaseModal.cost)) {
      if (purchaseModal.type === 'background') {
        setSelectedBg(purchaseModal.id);
      } else if (purchaseModal.type === 'effect') {
        setSelectedEffect(purchaseModal.id);
      }
    }
    setPurchaseModal(null);
  };

  const handleSave = () => {
    onSave?.({
      nickname: editedNickname.trim() || nickname,
      background: selectedBg,
      effect: selectedEffect,
    });
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

      <ModalWrapper title="닉네임 스타일" onClose={onClose} footer={footer}>
        <div className={styles.Content}>
          <div className={styles.Preview}>
            <NicknameBadge
              nickname={editedNickname || nickname}
              style={{ background: selectedBg, effect: selectedEffect }}
            />
          </div>

          <div className={styles.Section}>
            <h3 className={styles.SectionTitle}>닉네임</h3>
            <input
              type="text"
              className={styles.NicknameInput}
              value={editedNickname}
              onChange={(e) => setEditedNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              maxLength={12}
            />
          </div>

          <div className={styles.Section}>
            <h3 className={styles.SectionTitle}>배경 스타일</h3>
            <div className={styles.OptionsGrid}>
              {BACKGROUND_OPTIONS.map((option) => {
                const isUnlocked = unlockedBackgrounds.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.OptionButton} ${styles[`bg_${option.id}`]} ${
                      selectedBg === option.id ? styles.Selected : ""
                    } ${!isUnlocked ? styles.Locked : ""}`}
                    onClick={() => handleBackgroundClick(option.id, option.cost)}
                  >
                    {option.label}
                    {!isUnlocked && (
                      <div className={styles.LockBadge}>
                        <img src={coinImage} alt="코인" className={styles.CoinIconTiny} />
                        <span>{option.cost}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.Section}>
            <h3 className={styles.SectionTitle}>효과</h3>
            <div className={styles.EffectsRow}>
              {EFFECT_OPTIONS.map((option) => {
                const isUnlocked = unlockedEffects.includes(option.id);
                return (
                  <button
                    key={option.id || "none"}
                    type="button"
                    className={`${styles.EffectButton} ${
                      selectedEffect === option.id ? styles.Selected : ""
                    } ${!isUnlocked ? styles.Locked : ""}`}
                    onClick={() => handleEffectClick(option.id, option.cost)}
                    title={option.label}
                  >
                    {option.icon}
                    {!isUnlocked && (
                      <div className={styles.EffectLockBadge}>
                        <img src={coinImage} alt="코인" className={styles.CoinIconTiny} />
                        <span>{option.cost}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </ModalWrapper>
    </>
  );
}
