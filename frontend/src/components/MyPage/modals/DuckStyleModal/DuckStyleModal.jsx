import { useState } from "react";
import styles from "./DuckStyleModal.module.css";
import ModalWrapper from "../../common/ModalWrapper";

import duckImage from "../../../../assets/images/duck.png";

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
  currentColor = "yellow",
  currentAccessory = null,
  onSave,
  onClose,
}) {
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [selectedAccessory, setSelectedAccessory] = useState(currentAccessory);

  const handleSave = () => {
    onSave?.({ color: selectedColor, accessory: selectedAccessory });
    onClose?.();
  };

  const selectedColorObj = COLOR_OPTIONS.find((c) => c.id === selectedColor);

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
    <ModalWrapper title="AI 오리 스타일" onClose={onClose} footer={footer}>
      <div className={styles.Content}>
        <div
          className={styles.Preview}
          style={{ backgroundColor: selectedColorObj?.color || "#fef08a" }}
        >
          <div className={styles.DuckWrapper}>
            <img src={duckImage} alt="AI 오리" className={styles.DuckImage} />
            {selectedAccessory && (
              <span className={styles.Accessory}>
                {ACCESSORY_OPTIONS.find((a) => a.id === selectedAccessory)?.icon}
              </span>
            )}
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
