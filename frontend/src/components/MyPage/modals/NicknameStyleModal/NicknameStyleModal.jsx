import { useState } from "react";
import styles from "./NicknameStyleModal.module.css";
import ModalWrapper from "../../common/ModalWrapper";
import NicknameBadge from "../../ProfileSection/NicknameBadge";

const BACKGROUND_OPTIONS = [
  { id: "default", label: "기본" },
  { id: "gradient", label: "그라데이션" },
  { id: "ocean", label: "바다" },
  { id: "neon", label: "네온" },
  { id: "gold", label: "골드" },
  { id: "rainbow", label: "레인보우" },
];

const EFFECT_OPTIONS = [
  { id: null, icon: "❌", label: "없음" },
  { id: "sparkle", icon: "✨", label: "반짝임" },
  { id: "star", icon: "⭐", label: "별" },
  { id: "fire", icon: "🔥", label: "불꽃" },
  { id: "crown", icon: "👑", label: "왕관" },
];

export default function NicknameStyleModal({
  nickname = "example",
  currentStyle = {},
  onSave,
  onClose,
}) {
  const [selectedBg, setSelectedBg] = useState(currentStyle.background || "gradient");
  const [selectedEffect, setSelectedEffect] = useState(currentStyle.effect || null);

  const handleSave = () => {
    onSave?.({ background: selectedBg, effect: selectedEffect });
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
    <ModalWrapper title="닉네임 스타일" onClose={onClose} footer={footer}>
      <div className={styles.Content}>
        <div className={styles.Preview}>
          <NicknameBadge
            nickname={nickname}
            style={{ background: selectedBg, effect: selectedEffect }}
          />
        </div>

        <div className={styles.Section}>
          <h3 className={styles.SectionTitle}>배경 스타일</h3>
          <div className={styles.OptionsGrid}>
            {BACKGROUND_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`${styles.OptionButton} ${styles[`bg_${option.id}`]} ${
                  selectedBg === option.id ? styles.Selected : ""
                }`}
                onClick={() => setSelectedBg(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.Section}>
          <h3 className={styles.SectionTitle}>효과</h3>
          <div className={styles.EffectsRow}>
            {EFFECT_OPTIONS.map((option) => (
              <button
                key={option.id || "none"}
                type="button"
                className={`${styles.EffectButton} ${
                  selectedEffect === option.id ? styles.Selected : ""
                }`}
                onClick={() => setSelectedEffect(option.id)}
                title={option.label}
              >
                {option.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
