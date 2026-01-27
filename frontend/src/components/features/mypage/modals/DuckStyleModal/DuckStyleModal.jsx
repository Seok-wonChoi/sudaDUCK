import { useState } from "react";
import styles from "./DuckStyleModal.module.css";
import ModalWrapper from "@/components/features/mypage/common/ModalWrapper";

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
  { id: "yellow", color: "#fef08a" },
  { id: "blue", color: "#93c5fd" },
  { id: "pink", color: "#f9a8d4" },
  { id: "green", color: "#86efac" },
  { id: "purple", color: "#c4b5fd" },
  { id: "orange", color: "#fdba74" },
];

const ACCESSORY_OPTIONS = [
  { id: null, icon: "❌", label: "없음" },
  { id: "hat", icon: "🎩", label: "모자" },
  { id: "sunglasses", icon: "🕶️", label: "선글라스" },
  { id: "ribbon", icon: "🎀", label: "리본" },
  { id: "crown", icon: "👑", label: "왕관" },
];

export default function DuckStyleModal({
  currentProfileId = "profile1",
  currentColor = "yellow",
  currentAccessory = null,
  onSave,
  onClose,
}) {
  const [selectedProfileId, setSelectedProfileId] = useState(currentProfileId);
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [selectedAccessory, setSelectedAccessory] = useState(currentAccessory);

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
            {COLOR_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`${styles.ColorButton} ${
                  selectedColor === option.id ? styles.Selected : ""
                }`}
                style={{ backgroundColor: option.color }}
                onClick={() => setSelectedColor(option.id)}
                aria-label={option.id}
              />
            ))}
          </div>
        </div>

        <div className={styles.Section}>
          <h3 className={styles.SectionTitle}>액세서리</h3>
          <div className={styles.AccessoriesRow}>
            {ACCESSORY_OPTIONS.map((option) => (
              <button
                key={option.id || "none"}
                type="button"
                className={`${styles.AccessoryButton} ${
                  selectedAccessory === option.id ? styles.Selected : ""
                }`}
                onClick={() => setSelectedAccessory(option.id)}
                title={option.label}
              >
                {option.icon}
              </button>
            ))}
          </div>
          <div className={styles.AccessoryLabel}>
            {ACCESSORY_OPTIONS.find((a) => a.id === selectedAccessory)?.label || "없음"}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
