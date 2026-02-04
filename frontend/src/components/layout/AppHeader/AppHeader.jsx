import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AppHeader.module.css";
import gearIcon from "@/assets/icons/gear.png";
import duckLogo from "@/assets/images/duck_logo.png";

import duckProfile1 from "@/assets/images/duck_profile1.png";
import duckProfile2 from "@/assets/images/duck_profile2.png";
import duckProfile3 from "@/assets/images/duck_profile3.png";
import duckProfile4 from "@/assets/images/duck_profile4.png";

import ConfirmModal from "@/components/common/ConfirmModal/ConfirmModal";

const DUCK_PROFILE_IMAGES = {
  profile1: duckProfile1,
  profile2: duckProfile2,
  profile3: duckProfile3,
  profile4: duckProfile4,
};

const COLOR_MAP = {
  white: "#ffffff",
  yellow: "#fef08a",
  blue: "#93c5fd",
  pink: "#f9a8d4",
  green: "#86efac",
  purple: "#c4b5fd",
  orange: "#fdba74",
};

const ACCESSORY_MAP = {
  hat: "🎩",
  sunglasses: "🕶️",
  ribbon: "🎀",
  crown: "👑",
};


export default function AppHeader({
  userName = "user",
  notifications = [],
  notificationCount,
  initialMuted = false,
  initialVolume = 70,
  onChangeSound,
  // 로고 클릭 시 나가기 확인 관련 props
  logoExitMessage,
  logoExitConfirmText = "나가기",
  logoExitCancelText = "취소",
  onLogoExit,
}) {
  const navigate = useNavigate();
  const rootRef = useRef(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoExitModalOpen, setLogoExitModalOpen] = useState(false);
  const [logoExitProcessing, setLogoExitProcessing] = useState(false);

  const [muted, setMuted] = useState(initialMuted);
  const [volume, setVolume] = useState(initialVolume);

  // 프로필 정보 (localStorage에서 읽기)
  const [profileInfo, setProfileInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('userProfile');
      return saved ? JSON.parse(saved) : {
        profileId: 'profile1',
        color: 'white',
        accessory: null,
      };
    } catch {
      return {
        profileId: 'profile1',
        color: 'white',
        accessory: null,
      };
    }
  });

  // localStorage 변경 감지
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('userProfile');
        if (saved) {
          setProfileInfo(JSON.parse(saved));
        }
      } catch (error) {
        console.error('프로필 정보 읽기 실패:', error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // 같은 탭 내에서 변경을 감지하기 위한 커스텀 이벤트
    window.addEventListener('profileUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileUpdated', handleStorageChange);
    };
  }, []);

  const closeAll = () => {
    setSettingsOpen(false);
  };

  useEffect(() => {
    const onDocDown = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) closeAll();
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeAll();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const emitSound = (next) => {
    if (typeof onChangeSound === "function") onChangeSound(next);
  };


  const toggleSettings = () => {
    setSettingsOpen((v) => !v);
  };

  const onLogoClick = useCallback(() => {
    // 로고 클릭 시 나가기 확인이 필요한 경우 (logoExitMessage가 있으면)
    if (logoExitMessage) {
      setLogoExitModalOpen(true);
      return;
    }
    // 일반적인 경우 바로 메인으로 이동
    navigate("/main");
  }, [logoExitMessage, navigate]);

  const handleLogoExitConfirm = useCallback(async () => {
    if (logoExitProcessing) return;

    setLogoExitProcessing(true);
    try {
      // 나가기 콜백 실행 (leaveRoom API 호출 등)
      if (typeof onLogoExit === "function") {
        await onLogoExit();
      }

      setLogoExitModalOpen(false);
      navigate("/main");
    } catch (e) {
      console.error("로고 클릭 나가기 실패:", e);
      alert(e?.message || "나가기에 실패했습니다.");
    } finally {
      setLogoExitProcessing(false);
    }
  }, [onLogoExit, navigate, logoExitProcessing]);

  const handleLogoExitCancel = useCallback(() => {
    if (logoExitProcessing) return;
    setLogoExitModalOpen(false);
  }, [logoExitProcessing]);

  const onProfileClick = () => {
    navigate("/mypage");
  };

  const onMuteClick = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    emitSound({ muted: nextMuted, volume });
  };

  const onVolumeChange = (e) => {
    const nextVolume = Number(e.target.value);
    setVolume(nextVolume);

    const nextMuted = nextVolume === 0 ? true : muted;
    setMuted(nextMuted);

    emitSound({ muted: nextMuted, volume: nextVolume });
  };

  return (
    <header className={styles.Header} ref={rootRef}>
      <div className={styles.Left}>
        <button
          type="button"
          className={styles.BrandButton}
          onClick={onLogoClick}
          aria-label="메인으로 이동"
        >
          <div className={styles.LogoMark} aria-hidden="true">
            <img src={duckLogo} alt="" className={styles.LogoImage} />
          </div>
          <div className={styles.BrandText}>수다DUCK</div>
        </button>

      </div>

      <div className={styles.Right}>
        <button
          type="button"
          className={styles.AvatarButton}
          onClick={onProfileClick}
          aria-label="마이페이지로 이동"
        >
          <div
            className={styles.Avatar}
            style={{ backgroundColor: COLOR_MAP[profileInfo.color] || '#ffffff' }}
            aria-hidden="true"
          >
            <img
              src={DUCK_PROFILE_IMAGES[profileInfo.profileId]}
              alt="프로필"
              className={styles.AvatarImage}
            />
            {profileInfo.accessory && (
              <span className={styles.AvatarAccessory}>
                {ACCESSORY_MAP[profileInfo.accessory]}
              </span>
            )}
          </div>
        </button>

        <div className={styles.IconWrap}>
          <button
            type="button"
            className={`${styles.IconButton} ${settingsOpen ? styles.Active : ""}`}
            onClick={toggleSettings}
            aria-label="설정"
            aria-expanded={settingsOpen}
          >
            <img className={styles.IconImage} src={gearIcon} alt="" />
          </button>

          {settingsOpen && (
            <div className={styles.Popover} role="dialog" aria-label="사운드 설정">
              <div className={styles.PopoverTitle}>게임 사운드</div>

              <div className={styles.SoundRow}>
                <button
                  type="button"
                  className={`${styles.MuteButton} ${muted ? styles.MuteOn : ""}`}
                  onClick={onMuteClick}
                >
                  {muted ? "음소거 해제" : "음소거"}
                </button>

                <div className={styles.VolumeText}>{muted ? "0%" : `${volume}%`}</div>
              </div>

              <div className={styles.SliderRow}>
                <input
                  className={styles.Slider}
                  type="range"
                  min="0"
                  max="100"
                  value={muted ? 0 : volume}
                  onChange={onVolumeChange}
                />
              </div>

              <div className={styles.PopoverFooter}>
                <button type="button" className={styles.FooterButton} onClick={closeAll}>
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 로고 클릭 시 나가기 확인 모달 */}
      <ConfirmModal
        open={logoExitModalOpen}
        message={logoExitMessage || "메인 화면으로 나가시겠습니까?"}
        confirmText={logoExitProcessing ? "나가는 중..." : logoExitConfirmText}
        cancelText={logoExitCancelText}
        onConfirm={handleLogoExitConfirm}
        onClose={handleLogoExitCancel}
      />
    </header>
  );
}
