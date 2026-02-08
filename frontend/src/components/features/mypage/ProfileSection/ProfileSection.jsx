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
  hat: "?é©",
  sunglasses: "?ï∂Ô∏?,
  ribbon: "??",
  crown: "?ëë",
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
      // ?¨Ïö¥???¨ÏÉù ?§Ìå® Î¨¥Ïãú
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
          aria-label="?ÑÎ°ú??Î∞îÍæ∏Í∏?
        >
          <div
            className={styles.ProfileImage}
            style={{ background: COLOR_MAP[profileColor] || "#f3f4f6" }}
          >
            {profileImage ? (
              <img src={profileImage} alt="?ÑÎ°ú?? className={styles.Image} />
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
            <span className={styles.PencilIcon}>?èÔ∏è</span>
          </span>
        </button>

        <button
          type="button"
          className={styles.DuckImageContainer}
          onClick={onEditDuckBot}
          onMouseEnter={playTapSound}
          aria-label="AI?§Î¶¨Î¥?Î∞îÍæ∏Í∏?
        >
          <div className={styles.DuckImage}>
            {duckBotImage && (
              <img src={duckBotImage} alt="AI ?§Î¶¨Î¥? className={styles.Image} />
            )}
          </div>
          <span className={styles.EditButton} aria-hidden="true">
            <span className={styles.PencilIcon}>?èÔ∏è</span>
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
              aria-label="?âÎÑ§???§Ì???Î≥ÄÍ≤?
            >
              <span>?èÔ∏è</span>
            </button>
          </div>
          {onLogout && (
            <button
              type="button"
              className={styles.LogoutButton}
              onClick={onLogout}
              aria-label="Î°úÍ∑∏?ÑÏõÉ"
            >
              Î°úÍ∑∏?ÑÏõÉ
            </button>
          )}
        </div>
        <div className={styles.BottomRow}>
          <div className={styles.CoinBadge}>
            <img src={coinImage} alt="ÏΩîÏù∏" className={styles.CoinIcon} />
            <span className={styles.CoinAmount}>{coins}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
