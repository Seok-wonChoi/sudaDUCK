import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import bellIcon from "@/assets/icons/notice_bell.png";
import gearIcon from "@/assets/icons/gear.png";

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
    <header
      ref={rootRef}
      className="h-[76px] px-4 sm:px-6 flex items-center justify-between bg-white border-b border-gray-200"
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onLogoClick}
          aria-label="메인으로 이동"
          className="flex items-center gap-2.5 border-0 bg-transparent p-0 cursor-pointer"
        >
          <div
            className="w-5 h-5 sm:w-[22px] sm:h-[22px] rounded-full bg-indigo-500/20 border border-indigo-500/30"
            aria-hidden="true"
          />
          <div className="font-black text-lg sm:text-xl text-gray-900">Your Logo</div>
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Avatar */}
        <button
          type="button"
          onClick={onProfileClick}
          aria-label="마이페이지로 이동"
          className="border-0 bg-transparent p-0 cursor-pointer"
        >
          <div
            className="w-8 h-8 rounded-full bg-gray-900/10 border border-gray-900/10"
            aria-hidden="true"
          />
        </button>

        {/* Notification */}
        <div className="relative">
          <button
            type="button"
            onClick={toggleNotif}
            aria-label="알림"
            aria-expanded={notifOpen}
            className={`w-9 h-9 sm:w-[38px] sm:h-[38px] rounded-xl border grid place-items-center cursor-pointer transition-colors
              ${notifOpen
                ? "border-indigo-500/35 bg-indigo-500/10"
                : "border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/15"
              }`}
          >
            <img className="w-[18px] h-[18px] object-contain block" src={bellIcon} alt="" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-600 text-white text-xs font-black grid place-items-center">
                {count}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              role="dialog"
              aria-label="알림 목록"
              className="absolute top-12 right-0 w-[280px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-20"
            >
              <div className="px-3.5 py-3 font-black text-gray-900 border-b border-gray-200">
                알림
              </div>
              <div className="p-3.5">
                {notifications.length === 0 ? (
                  <div className="text-gray-500 text-sm font-bold">새 알림이 없습니다.</div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id ?? n.text}
                      className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 [&+&]:mt-2.5"
                    >
                      <div className="font-extrabold text-gray-900 text-sm">{n.text}</div>
                      {n.time && <div className="mt-1.5 text-xs text-gray-500 font-bold">{n.time}</div>}
                    </div>
                  ))
                )}
              </div>
              <div className="px-3.5 py-3 border-t border-gray-200 flex justify-end">
                <button
                  type="button"
                  onClick={closeAll}
                  className="border-0 bg-transparent cursor-pointer font-black text-indigo-600"
                >
                  닫기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="relative">
          <button
            type="button"
            onClick={toggleSettings}
            aria-label="설정"
            aria-expanded={settingsOpen}
            className={`w-9 h-9 sm:w-[38px] sm:h-[38px] rounded-xl border grid place-items-center cursor-pointer transition-colors
              ${settingsOpen
                ? "border-indigo-500/35 bg-indigo-500/10"
                : "border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/15"
              }`}
          >
            <img className="w-[18px] h-[18px] object-contain block" src={gearIcon} alt="" />
          </button>

          {settingsOpen && (
            <div
              role="dialog"
              aria-label="사운드 설정"
              className="absolute top-12 right-0 w-[280px] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-20"
            >
              <div className="px-3.5 py-3 font-black text-gray-900 border-b border-gray-200">
                게임 사운드
              </div>

              <div className="p-3.5">
                <div className="flex items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={onMuteClick}
                    className={`px-3 py-2.5 rounded-xl cursor-pointer font-black text-xs border transition-colors
                      ${muted
                        ? "border-blue-500/35 bg-blue-500/10 text-blue-700"
                        : "border-indigo-500/25 bg-indigo-500/10 text-indigo-800"
                      }`}
                  >
                    {muted ? "음소거 해제" : "음소거"}
                  </button>
                  <div className="font-black text-gray-900 text-xs">
                    {muted ? "0%" : `${volume}%`}
                  </div>
                </div>

                <div className="mt-3">
                  <input
                    className="w-full"
                    type="range"
                    min="0"
                    max="100"
                    value={muted ? 0 : volume}
                    onChange={onVolumeChange}
                  />
                </div>
              </div>

              <div className="px-3.5 py-3 border-t border-gray-200 flex justify-end">
                <button
                  type="button"
                  onClick={closeAll}
                  className="border-0 bg-transparent cursor-pointer font-black text-indigo-600"
                >
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
