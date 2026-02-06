import { useCallback } from "react";
import { useSoundContext } from "@/context/SoundContext";

/**
 * 마스터 볼륨이 적용된 사운드 재생 훅
 * @returns {function} playSound - 사운드 재생 함수
 */
export default function useSound() {
  const { getEffectiveVolume, isMuted } = useSoundContext();

  const playSound = useCallback(
    (soundFile, baseVolume = 0.5) => {
      if (isMuted) return;

      try {
        const audio = new Audio(soundFile);
        audio.volume = getEffectiveVolume(baseVolume);
        audio.play().catch(() => {});
      } catch (e) {
        // 사운드 재생 실패 무시
      }
    },
    [getEffectiveVolume, isMuted]
  );

  return playSound;
}
