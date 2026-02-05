import styles from "./ProfileSection.module.css";
import NicknameBadge from "./NicknameBadge";
import coinImage from "@/assets/images/coin.png";
import tapSound from "@/assets/sounds/tap.wav";
import { useSoundContext } from "@/context/SoundContext";

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

export default function ProfileSection({
  profileImage,
  profileColor = "yellow",
  profileAccessory = null,
  nickname = "user",
  email = "example@test.com",
  nicknameStyle = { background: "gradient", effect: null },
  duckBotImage,
  coins = 0,
  onEditProfile,
  onEditNickname,
  onEditDuckBot,
  onLogout,
}) {
  const { getEffectiveVolume, isMuted } = useSoundContext();

  const playTapSound = () => {
    if (isMuted) return;
    try {
      const audio = new Audio(tapSound);
      audio.volume = getEffectiveVolume(0.1);
      audio.play().catch(() => {});
    } catch (e) {
      // 사운드 재생 실패 무시
    }
  };

  return (
    <div className={styles.Section}>
      <div className={styles.ImagesWrapper}>
        <button
          type="button"
          className={styles.ProfileImageContainer}
          onClick={onEditProfile}
          onMouseEnter={playTapSound}
          aria-label="프로필 바꾸기"
        >
          <div
            className={styles.ProfileImage}
            style={{ background: COLOR_MAP[profileColor] || "#f3f4f6" }}
          >
            {profileImage ? (
              <img src={profileImage} alt="프로필" className={styles.Image} />
            ) : (
              <div className={styles.DefaultAvatar} />
            )}
            {profileAccessory && (
              <span className={styles.ProfileAccessory}>
                {ACCESSORY_MAP[profileAccessory]}
              </span>
            )}
          </div>
          <span className={styles.EditButton} aria-hidden="true">
            <span className={styles.PencilIcon}>✏️</span>
          </span>
        </button>

        <button
          type="button"
          className={styles.DuckImageContainer}
          onClick={onEditDuckBot}
          onMouseEnter={playTapSound}
          aria-label="AI오리봇 바꾸기"
        >
          <div className={styles.DuckImage}>
            {duckBotImage && (
              <img src={duckBotImage} alt="AI 오리봇" className={styles.Image} />
            )}
          </div>
          <span className={styles.EditButton} aria-hidden="true">
            <span className={styles.PencilIcon}>✏️</span>
          </span>
        </button>
      </div>

      <div className={styles.InfoCard}>
        <div className={styles.InfoContent}>
          <div className={styles.NicknameWrapper}>
            <NicknameBadge
              nickname={nickname}
              style={nicknameStyle}
            />
            <button
              type="button"
              className={styles.NicknameEditButton}
              onClick={onEditNickname}
              aria-label="닉네임 스타일 변경"
            >
              <span>✏️</span>
            </button>
          </div>
          {onLogout && (
            <button
              type="button"
              className={styles.LogoutButton}
              onClick={onLogout}
              aria-label="로그아웃"
            >
              로그아웃
            </button>
          )}
        </div>
        <div className={styles.BottomRow}>
          <div className={styles.CoinBadge}>
            <img src={coinImage} alt="코인" className={styles.CoinIcon} />
            <span className={styles.CoinAmount}>{coins}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
