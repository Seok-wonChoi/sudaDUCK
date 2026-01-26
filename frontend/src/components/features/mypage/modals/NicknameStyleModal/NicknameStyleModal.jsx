import { useState } from "react";
import ModalWrapper from "@/components/features/mypage/common/ModalWrapper";
import NicknameBadge from "@/components/features/mypage/ProfileSection/NicknameBadge";

const BACKGROUND_OPTIONS = [
  { id: "default", label: "기본", className: "bg-white border border-gray-200 text-gray-900" },
  { id: "gradient", label: "그라데이션", className: "bg-gradient-to-r from-purple-400 to-pink-400 border-none text-white" },
  { id: "ocean", label: "바다", className: "bg-gradient-to-r from-cyan-500 to-blue-500 border-none text-white" },
  { id: "neon", label: "네온", className: "bg-black border-2 border-green-500 text-green-500" },
  { id: "gold", label: "골드", className: "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 border-none text-white" },
  { id: "rainbow", label: "레인보우", className: "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 to-violet-500 border-none text-white" },
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
    <ModalWrapper title="닉네임 스타일" onClose={onClose} footer={footer}>
      <div className="flex flex-col gap-6">
        <div className="bg-gray-50 rounded-2xl py-10 px-5 flex items-center justify-center">
          <NicknameBadge
            nickname={nickname}
            style={{ background: selectedBg, effect: selectedEffect }}
          />
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-[15px] font-extrabold text-gray-900 text-center m-0">배경 스타일</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {BACKGROUND_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`h-11 rounded-full text-sm font-bold cursor-pointer transition-all
                  ${option.className}
                  ${selectedBg === option.id ? "outline-3 outline outline-indigo-600 outline-offset-2" : ""}`}
                onClick={() => setSelectedBg(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-[15px] font-extrabold text-gray-900 text-center m-0">효과</h3>
          <div className="flex justify-center gap-3">
            {EFFECT_OPTIONS.map((option) => (
              <button
                key={option.id || "none"}
                type="button"
                className={`w-14 h-14 rounded-xl border border-gray-200 bg-white text-2xl
                  cursor-pointer transition-all hover:bg-gray-50
                  ${selectedEffect === option.id ? "border-indigo-600 outline-2 outline outline-indigo-600" : ""}`}
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
