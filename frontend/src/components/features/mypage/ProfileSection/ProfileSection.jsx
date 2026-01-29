import styles from "./ProfileSection.module.css";
import NicknameBadge from "./NicknameBadge";

const COLOR_MAP = {
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
  onEditProfile,
  onEditNickname,
  onEditDuckBot,
  onLogout,
}) {
  return (
    <div className={styles.Section}>
      <div className={styles.ImagesWrapper}>
        <div className={styles.ProfileImageContainer}>
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
          <button
            type="button"
            className={styles.EditButton}
            onClick={onEditProfile}
            aria-label="프로필 바꾸기"
          >
            <span className={styles.PencilIcon}>✏️</span>
          </button>
        </div>

        <div className={styles.DuckImageContainer}>
          <div className={styles.DuckImage}>
            {duckBotImage && (
              <img src={duckBotImage} alt="AI 오리봇" className={styles.Image} />
            )}
          </div>
          <button
            type="button"
            className={styles.EditButton}
            onClick={onEditDuckBot}
            aria-label="AI오리봇 바꾸기"
          >
            <span className={styles.PencilIcon}>✏️</span>
          </button>
        </div>
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
        <div className={styles.Email}>{email}</div>
      </div>
    </div>
  );
}
