import { useEffect, useRef } from "react";
import clickMp3 from "@/assets/sounds/click.mp3";
import { useSoundContext } from "@/context/SoundContext";

/**
 * enabled=true일 때만 문서 클릭 소리를 재생
 * - a/button/role=button 등 '클릭 가능한 요소' 위주로만 반응
 * - input range/textarea 등은 제외 가능
 */
export default function useClickSound(enabled, options = {}) {
  const {
    volume = 10,
    selector = 'button, a, [role="button"], [data-click-sound="true"]',
    excludeSelector = 'input, textarea, select, [data-click-sound="false"]',
    throttleMs = 40, // 너무 연타될 때 귀 아플 수 있어서 살짝 제한
  } = options;

  const { getEffectiveVolume, isMuted } = useSoundContext();
  const audioRef = useRef(null);
  const lastPlayRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    // 오디오 준비
    const audio = new Audio(clickMp3);
    audioRef.current = audio;

    const onPointerDown = (e) => {
      // 음소거 상태면 재생 안 함
      if (isMuted) return;

      // 제외 대상이면 무시
      if (excludeSelector && e.target.closest(excludeSelector)) return;

      // 클릭 가능한 요소만
      if (selector && !e.target.closest(selector)) return;

      // throttle
      const now = Date.now();
      if (now - lastPlayRef.current < throttleMs) return;
      lastPlayRef.current = now;

      // 재생 (짧은 효과음이라 currentTime 리셋)
      try {
        audio.volume = getEffectiveVolume(volume);
        audio.currentTime = 0;
        audio.play();
      } catch {
        // 자동재생 정책으로 실패할 수 있음(첫 사용자 제스처 이후엔 대체로 OK)
      }
    };

    document.addEventListener("pointerdown", onPointerDown, { capture: true });

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, { capture: true });
      audioRef.current = null;
    };
  }, [enabled, volume, selector, excludeSelector, throttleMs, getEffectiveVolume, isMuted]);
}
