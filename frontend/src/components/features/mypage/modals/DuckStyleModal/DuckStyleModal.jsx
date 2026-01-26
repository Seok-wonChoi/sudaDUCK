import { useState } from "react";
import ModalWrapper from "@/components/features/mypage/common/ModalWrapper";
import duckImage from "@/assets/images/duck.png";

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
      <button
        type="button"
        className="py-2.5 px-6 border border-gray-200 rounded-[10px] bg-white text-gray-700
          text-sm font-bold cursor-pointer hover:bg-gray-50"
        onClick={onClose}
      >
        취소
      </button>
      <button
        type="button"
        className="py-2.5 px-6 border-none rounded-[10px] bg-gradient-to-r from-indigo-600 to-violet-600
          text-white text-sm font-bold cursor-pointer hover:brightness-105"
        onClick={handleSave}
      >
        저장
      </button>
    </>
  );

  return (
    <ModalWrapper title="AI 오리 스타일" onClose={onClose} footer={footer}>
      <div className="flex flex-col gap-6">
        <div
          className="rounded-2xl p-[30px] flex items-center justify-center transition-colors"
          style={{ backgroundColor: selectedColorObj?.color || "#fef08a" }}
        >
          <div className="relative w-40 h-40">
            <img src={duckImage} alt="AI 오리" className="w-full h-full object-contain" />
            {selectedAccessory && (
              <span className="absolute -top-2.5 right-5 text-[32px]">
                {ACCESSORY_OPTIONS.find((a) => a.id === selectedAccessory)?.icon}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <h3 className="text-[15px] font-extrabold text-gray-900 m-0">색상</h3>
          <div className="flex justify-center gap-3">
            {COLOR_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`w-[52px] h-[52px] rounded-xl border-none cursor-pointer transition-all
                  hover:scale-105 ${selectedColor === option.id ? "outline-3 outline outline-indigo-600 outline-offset-2" : ""}`}
                style={{ backgroundColor: option.color }}
                onClick={() => setSelectedColor(option.id)}
                aria-label={option.id}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <h3 className="text-[15px] font-extrabold text-gray-900 m-0">액세서리</h3>
          <div className="flex justify-center gap-3">
            {ACCESSORY_OPTIONS.map((option) => (
              <button
                key={option.id || "none"}
                type="button"
                className={`w-14 h-14 rounded-xl border border-gray-200 bg-white text-2xl
                  cursor-pointer transition-all hover:bg-gray-50
                  ${selectedAccessory === option.id ? "border-indigo-600 outline-2 outline outline-indigo-600" : ""}`}
                onClick={() => setSelectedAccessory(option.id)}
                title={option.label}
              >
                {option.icon}
              </button>
            ))}
          </div>
          <div className="text-[13px] text-gray-500">
            {ACCESSORY_OPTIONS.find((a) => a.id === selectedAccessory)?.label || "없음"}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
