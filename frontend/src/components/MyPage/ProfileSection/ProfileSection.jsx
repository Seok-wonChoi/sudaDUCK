import styles from "./ProfileSection.module.css";
import NicknameBadge from "./NicknameBadge";

import duckImage from "../../../assets/images/duck.png";

export default function ProfileSection({
  profileImage,
  nickname = "user",
  email = "example@test.com",
  nicknameStyle = { background: "gradient", effect: null },
  duckColor = "yellow",
  duckAccessory = null,
  onEditProfile,
  onEditNickname,
  onEditDuck,
}) {
  return (
    <div className={styles.Section}>
      <div className={styles.ImagesWrapper}>
        <div className={styles.ProfileImageContainer}>
          <div className={styles.ProfileImage}>
            {profileImage ? (
              <img src={profileImage} alt="프로필" className={styles.Image} />
            ) : (
              <div className={styles.DefaultAvatar} />
            )}
          </div>
          <button
            type="button"
            className={styles.EditButton}
            onClick={onEditProfile}
            aria-label="프로필 사진 변경"
          >
            <span className={styles.CameraIcon}>📷</span>
          </button>
        </div>

        <div className={styles.DuckImageContainer}>
          <div className={styles.DuckImage}>
            <img src={duckImage} alt="AI 오리" className={styles.Image} />
          </div>
          <button
            type="button"
            className={styles.EditButton}
            onClick={onEditDuck}
            aria-label="AI 오리 스타일 변경"
          >
            <span className={styles.PencilIcon}>✏️</span>
          </button>
        </div>
      </div>

      <div className={styles.InfoCard}>
        <div className={styles.InfoContent}>
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
        <div className={styles.Email}>{email}</div>
      </div>
    </div>
  );
}
