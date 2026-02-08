import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AppHeader.module.css";
import { Volume2, VolumeX } from "lucide-react";
import duckLogo from "@/assets/images/duck_logo.png";
import { useSoundContext } from "@/context/SoundContext";
import clickMp3 from "@/assets/sounds/click.mp3";

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
  hat: "?é©",
  sunglasses: "?ï∂Ô∏?,
  ribbon: "??",
  crown: "?ëë",
};


export default function AppHeader({
  userName = "user",
  notifications = [],
  notificationCount,
  initialMuted = false,
  initialVolume = 70,
  onChangeSound,
  // Î°úÍ≥† ?¥Î¶≠ ???òÍ?Í∏??ïÏù∏ Í¥Ä??props
  logoExitMessage,
  logoExitConfirmText = "?òÍ?Í∏?,
  logoExitCancelText = "Ï∑®ÏÜå",
  onLogoExit,
  // ?ÑÎ°ú???¥Î¶≠ Ï∞®Îã® (?πÏÜåÏº??∞Í≤∞ Ï§?
  disableProfileClick = false,
}) {
  const navigate = useNavigate();
  const rootRef = useRef(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoExitModalOpen, setLogoExitModalOpen] = useState(false);
  const [logoExitProcessing, setLogoExitProcessing] = useState(false);
  const [profileBlockModalOpen, setProfileBlockModalOpen] = useState(false);

  // ?¨Ïö¥??Ïª®ÌÖç?§Ìä∏ ?¨Ïö©
  const { masterVolume, setMasterVolume, isMuted, setIsMuted } = useSoundContext();

  // ?åÏÜåÍ±???Î≥ºÎ•® ?Ä?•Ïö© Î°úÏª¨ ?ÅÌÉú
  const [savedVolume, setSavedVolume] = useState(70);

  // ?ÑÎ°ú???ïÎ≥¥ (localStorage?êÏÑú ?ΩÍ∏∞)
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

  // localStorage Î≥ÄÍ≤?Í∞êÏ?
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('userProfile');
        if (saved) {
          setProfileInfo(JSON.parse(saved));
        }
      } catch (error) {
        console.error('?ÑÎ°ú???ïÎ≥¥ ?ΩÍ∏∞ ?§Ìå®:', error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Í∞ôÏ? ???¥Ïóê??Î≥ÄÍ≤ΩÏùÑ Í∞êÏ??òÍ∏∞ ?ÑÌïú Ïª§Ïä§?Ä ?¥Î≤§??
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
    // Î°úÍ≥† ?¥Î¶≠ ???òÍ?Í∏??ïÏù∏???ÑÏöî??Í≤ΩÏö∞ (logoExitMessageÍ∞Ä ?àÏúºÎ©?
    if (logoExitMessage) {
      setLogoExitModalOpen(true);
      return;
    }
    // ?ºÎ∞ò?ÅÏù∏ Í≤ΩÏö∞ Î∞îÎ°ú Î©îÏù∏?ºÎ°ú ?¥Îèô
    navigate("/main");
  }, [logoExitMessage, navigate]);

  const handleLogoExitConfirm = useCallback(async () => {
    if (logoExitProcessing) return;

    setLogoExitProcessing(true);
    try {
      // ?òÍ?Í∏?ÏΩúÎ∞± ?§Ìñâ (leaveRoom API ?∏Ï∂ú ??
      if (typeof onLogoExit === "function") {
        await onLogoExit();
      }

      setLogoExitModalOpen(false);
      navigate("/main");
    } catch (e) {
      console.error("Î°úÍ≥† ?¥Î¶≠ ?òÍ?Í∏??§Ìå®:", e);
      alert(e?.message || "?òÍ?Í∏∞Ïóê ?§Ìå®?àÏäµ?àÎã§.");
    } finally {
      setLogoExitProcessing(false);
    }
  }, [onLogoExit, navigate, logoExitProcessing]);

  const handleLogoExitCancel = useCallback(() => {
    if (logoExitProcessing) return;
    setLogoExitModalOpen(false);
  }, [logoExitProcessing]);

  const onProfileClick = () => {
    // ?πÏÜåÏº??∞Í≤∞ Ï§ëÏóê???ÑÎ°ú???òÏù¥ÏßÄ ?¥Îèô Ï∞®Îã®
    if (disableProfileClick) {
      setProfileBlockModalOpen(true);
      return;
    }
    navigate("/mypage");
  };

  const onMuteClick = () => {
    const nextMuted = !isMuted;

    if (nextMuted) {
      // ?åÏÜåÍ±? ?ÑÏû¨ Î≥ºÎ•® ?Ä?•ÌïòÍ≥?Î≥ºÎ•®??0?ºÎ°ú (Î¨¥Ïùå)
      setSavedVolume(masterVolume);
      setMasterVolume(0);
      setIsMuted(true);
      emitSound({ muted: true, volume: 0 });
    } else {
      // ?åÏÜåÍ±??¥Ï†ú: ?Ä?•Îêú Î≥ºÎ•®?ºÎ°ú Î≥µÏõê (?¥Î¶≠ ?¨Ïö¥???¨ÏÉù)
      const restoreVolume = savedVolume > 0 ? savedVolume : 70;
      setMasterVolume(restoreVolume);
      setIsMuted(false);

      // ?åÏÜåÍ±??¥Ï†ú ???¥Î¶≠ ?¨Ïö¥???¨ÏÉù
      try {
        const audio = new Audio(clickMp3);
        audio.volume = (restoreVolume / 100) * 0.1; // master volume ?ÅÏö© (10% Í∏∞Î≥∏ Î≥ºÎ•®)
        audio.play().catch(() => {});
      } catch (e) {
        // ?¨Ïö¥???¨ÏÉù ?§Ìå® Î¨¥Ïãú
      }

      emitSound({ muted: false, volume: restoreVolume });
    }
  };

  const onVolumeChange = (e) => {
    const nextVolume = Number(e.target.value);
    setMasterVolume(nextVolume);

    // ?¨Îùº?¥ÎçîÎ•??ÄÏßÅÏù¥Î©??êÎèô?ºÎ°ú ?åÏÜåÍ±??¥Ï†ú
    if (isMuted && nextVolume > 0) {
      setIsMuted(false);
      emitSound({ muted: false, volume: nextVolume });
    } else {
      emitSound({ muted: isMuted, volume: nextVolume });
    }
  };

  return (
    <header className={styles.Header} ref={rootRef}>
      <div className={styles.Left}>
        <button
          type="button"
          className={styles.BrandButton}
          onClick={onLogoClick}
          aria-label="Î©îÏù∏?ºÎ°ú ?¥Îèô"
        >
          <div className={styles.LogoMark} aria-hidden="true">
            <img src={duckLogo} alt="" className={styles.LogoImage} />
          </div>
          <div className={styles.BrandText}>?òÎã§DUCK</div>
        </button>

      </div>

      <div className={styles.Right}>
        <button
          type="button"
          className={styles.AvatarButton}
          onClick={onProfileClick}
          aria-label="ÎßàÏù¥?òÏù¥ÏßÄÎ°??¥Îèô"
        >
          <div
            className={styles.Avatar}
            style={{ backgroundColor: COLOR_MAP[profileInfo.color] || '#ffffff' }}
            aria-hidden="true"
          >
            <img
              src={DUCK_PROFILE_IMAGES[profileInfo.profileId]}
              alt="?ÑÎ°ú??
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
            aria-label={isMuted ? "?åÏÜåÍ±??ÅÌÉú - ?¨Ïö¥???§Ï†ï" : "?¨Ïö¥???§Ï†ï"}
            aria-expanded={settingsOpen}
          >
            {isMuted ? (
              <VolumeX className={styles.IconSvg} />
            ) : (
              <Volume2 className={styles.IconSvg} />
            )}
          </button>

          {settingsOpen && (
            <div className={styles.Popover} role="dialog" aria-label="?¨Ïö¥???§Ï†ï">
              <div className={styles.PopoverTitle}>Í≤åÏûÑ ?¨Ïö¥??/div>

              <div className={styles.SoundRow}>
                <button
                  type="button"
                  className={`${styles.MuteButton} ${isMuted ? styles.MuteOn : ""}`}
                  onClick={onMuteClick}
                  data-click-sound="false"
                >
                  {isMuted ? "?åÏÜåÍ±??¥Ï†ú" : "?åÏÜåÍ±?}
                </button>

                <div className={styles.VolumeText}>{masterVolume}%</div>
              </div>

              <div className={styles.SliderRow}>
                <input
                  className={styles.Slider}
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={onVolumeChange}
                />
              </div>

              <div className={styles.PopoverFooter}>
                <button type="button" className={styles.FooterButton} onClick={closeAll}>
                  ?´Í∏∞
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Î°úÍ≥† ?¥Î¶≠ ???òÍ?Í∏??ïÏù∏ Î™®Îã¨ */}
      <ConfirmModal
        open={logoExitModalOpen}
        message={logoExitMessage || "Î©îÏù∏ ?îÎ©¥?ºÎ°ú ?òÍ??úÍ≤†?µÎãàÍπ?"}
        confirmText={logoExitProcessing ? "?òÍ???Ï§?.." : logoExitConfirmText}
        cancelText={logoExitCancelText}
        onConfirm={handleLogoExitConfirm}
        onClose={handleLogoExitCancel}
      />

      {/* ?ÑÎ°ú???¥Î¶≠ Ï∞®Îã® Î™®Îã¨ */}
      <ConfirmModal
        open={profileBlockModalOpen}
        message="Í≤åÏûÑ??ÏßÑÌñâ Ï§ëÏùº ?åÎäî ÎßàÏù¥?òÏù¥ÏßÄÎ°??¥Îèô?????ÜÏäµ?àÎã§."
        confirmText="?ïÏù∏"
        cancelText={null}
        onConfirm={() => setProfileBlockModalOpen(false)}
        onClose={() => setProfileBlockModalOpen(false)}
      />
    </header>
  );
}
