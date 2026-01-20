import styles from './Header.module.css';
import profileImg from '@/assets/profile.png';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#2B7FFF" />
          <path d="M2 17L12 22L22 17" stroke="#2B7FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="#2B7FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className={styles.logoText}>Your Logo</span>
      </div>

      <div className={styles.actions}>
        <button className={styles.iconButton} aria-label="Profile">
          <div className={styles.profileImage}>
            <img src={profileImg} alt="Profile" />
          </div>
        </button>
        <button className={styles.iconButton} aria-label="Notifications">
          <div className={styles.notificationWrapper}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className={styles.badge}>3</span>
          </div>
        </button>
        <button className={styles.iconButton} aria-label="Settings">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="3" strokeWidth="2"/>
            <path d="M12 1v6m0 6v6M1 12h6m6 0h6" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
