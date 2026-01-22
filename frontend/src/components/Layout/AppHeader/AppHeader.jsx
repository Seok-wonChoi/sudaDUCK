import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AppHeader.module.css";

import bellIcon from "../../../assets/icons/notice_bell.png";
import gearIcon from "../../../assets/icons/gear.png";

export default function AppHeader({
  userName = "user",
  notifications = [],
  notificationCount,
  initialMuted = false,
  initialVolume = 70,
  onChangeSound,
}) {
  const navigate = useNavigate();
  const rootRef = useRef(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [muted, setMuted] = useState(initialMuted);
  const [volume, setVolume] = useState(initialVolume);

  const count =
    typeof notificationCount === "number" ? notificationCount : notifications.length;

  const closeAll = () => {
    setNotifOpen(false);
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

  const toggleNotif = () => {
    setSettingsOpen(false);
    setNotifOpen((v) => !v);
  };

  const toggleSettings = () => {
    setNotifOpen(false);
    setSettingsOpen((v) => !v);
  };

  const onLogoClick = () => {
    navigate("/");
  };

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
          <div className={styles.LogoMark} aria-hidden="true" />
          <div className={styles.BrandText}>Your Logo</div>
        </button>

      </div>

      <div className={styles.Right}>
        <button
          type="button"
          className={styles.AvatarButton}
          onClick={onProfileClick}
          aria-label="마이페이지로 이동"
        >
          <div className={styles.Avatar} aria-hidden="true" />
        </button>

        <div className={styles.IconWrap}>
          <button
            type="button"
            className={`${styles.IconButton} ${notifOpen ? styles.Active : ""}`}
            onClick={toggleNotif}
            aria-label="알림"
            aria-expanded={notifOpen}
          >
            <img className={styles.IconImage} src={bellIcon} alt="" />
            {count > 0 && <span className={styles.Badge}>{count}</span>}
          </button>

          {notifOpen && (
            <div className={styles.Popover} role="dialog" aria-label="알림 목록">
              <div className={styles.PopoverTitle}>알림</div>
              <div className={styles.PopoverBody}>
                {notifications.length === 0 ? (
                  <div className={styles.EmptyText}>새 알림이 없습니다.</div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div className={styles.NotifItem} key={n.id ?? n.text}>
                      <div className={styles.NotifText}>{n.text}</div>
                      {n.time && <div className={styles.NotifTime}>{n.time}</div>}
                    </div>
                  ))
                )}
              </div>
              <div className={styles.PopoverFooter}>
                <button type="button" className={styles.FooterButton} onClick={closeAll}>
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>

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
    </header>
  );
}
