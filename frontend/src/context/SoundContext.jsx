import { createContext, useContext, useState, useCallback, useEffect } from "react";

const SoundContext = createContext();

const STORAGE_KEY_VOLUME = "masterVolume";
const STORAGE_KEY_MUTED = "isMuted";

export function SoundProvider({ children }) {
  // localStorage?�서 초기�?로드
  const [masterVolume, setMasterVolume] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VOLUME);
      return saved !== null ? Number(saved) : 70;
    } catch {
      return 70;
    }
  });

  const [isMuted, setIsMuted] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MUTED);
      return saved === "true";
    } catch {
      return false;
    }
  });

  // masterVolume 변�???localStorage???�??
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VOLUME, String(masterVolume));
    } catch (e) {
      console.error("Failed to save master volume:", e);
    }
  }, [masterVolume]);

  // isMuted 변�???localStorage???�??
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MUTED, String(isMuted));
    } catch (e) {
      console.error("Failed to save mute state:", e);
    }
  }, [isMuted]);

  /**
   * ?�제 ?�생??볼륨 계산
   * @param {number} baseVolume - ?�본 볼륨 (0~1)
   * @returns {number} 마스??볼륨???�용??최종 볼륨 (0~1)
   */
  const getEffectiveVolume = useCallback(
    (baseVolume) => {
      if (isMuted) return 0;
      return baseVolume * (masterVolume / 100);
    },
    [masterVolume, isMuted]
  );

  /**
   * ?�운???�생 ?�퍼 ?�수
   * @param {string|Audio} soundSource - ?�운???�일 경로 ?�는 Audio 객체
   * @param {number} baseVolume - 기본 볼륨 (0~1)
   */
  const playSound = useCallback(
    (soundSource, baseVolume = 0.5) => {
      if (isMuted) return;

      try {
        const audio = typeof soundSource === "string" ? new Audio(soundSource) : soundSource;
        audio.volume = getEffectiveVolume(baseVolume);
        audio.play().catch(() => {});
      } catch (e) {
        // ?�운???�생 ?�패 무시
      }
    },
    [isMuted, getEffectiveVolume]
  );

  const value = {
    masterVolume,
    setMasterVolume,
    isMuted,
    setIsMuted,
    getEffectiveVolume,
    playSound,
  };

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSoundContext() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSoundContext must be used within SoundProvider");
  }
  return context;
}
