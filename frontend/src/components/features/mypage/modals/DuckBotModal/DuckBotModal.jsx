import { useState } from "react";
import styles from "./DuckBotModal.module.css";
import ModalWrapper from "@/components/features/mypage/common/ModalWrapper";

import duckBotCyan from "@/assets/images/duck_bot_cyan.png";
import duckBotOrange from "@/assets/images/duck_bot_orange.png";
import duckBotDigital from "@/assets/images/duck_bot_digital.png";
import duckBotMecha from "@/assets/images/duck_bot_mecha.png";

const DUCK_OPTIONS = [
  { id: "cyan", label: "사이버", image: duckBotCyan },
  { id: "orange", label: "아머", image: duckBotOrange },
  { id: "digital", label: "디지털", image: duckBotDigital },
  { id: "mecha", label: "메카", image: duckBotMecha },
];

export default function DuckBotModal({
  currentDuckId = "cyan",
  onSave,
  onClose,
}) {
  const [selectedId, setSelectedId] = useState(currentDuckId);

  const selectedDuck = DUCK_OPTIONS.find((d) => d.id === selectedId);

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
          {DUCK_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`${styles.DuckCard} ${
                selectedId === option.id ? styles.Selected : ""
              }`}
              onClick={() => setSelectedId(option.id)}
            >
              <img
                src={option.image}
                alt={option.label}
                className={styles.DuckThumb}
              />
              <span className={styles.DuckLabel}>{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </ModalWrapper>
  );
}
