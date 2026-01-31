import styles from "./LoginPage.module.css";
import duckHappy from "@/assets/images/duck_happy.png";
import duckTogether from "@/assets/images/duck_together.png";
import duckLogo from "@/assets/images/duck_logo.png";
import kakaoIcon from "@/assets/icons/kakaotalk_icon.png";
import { loginWithKakao } from "@/api/auth";

export default function LoginPage() {
  const handleKakaoLogin = () => {
    loginWithKakao();
  };

  return (
    <div className={styles.Page}>
      {/* 노이즈 오버레이 */}
      <div className={styles.noiseOverlay}></div>

      {/* 떠다니는 장식 요소들 */}
      <div className={styles.floatingDecoration1}>AI</div>
      <div className={styles.floatingDecoration2}>💬</div>
      <div className={styles.floatingDecoration3}>Study</div>
      <div className={styles.floatingDecoration4}>💭</div>
      <div className={styles.floatingDecoration5}>English</div>
      <div className={styles.floatingDecoration6}>✨</div>
      <div className={styles.floatingDecoration7}>안녕하세요</div>
      <div className={styles.floatingDecoration8}>📚</div>
      <div className={styles.floatingDecoration9}>Good</div>
      <div className={styles.floatingDecoration10}>🎯</div>
      <div className={styles.floatingDecoration11}>학습</div>
      <div className={styles.floatingDecoration12}>🌟</div>
      <div className={styles.floatingDecoration13}>Thank you</div>
      <div className={styles.floatingDecoration14}>🗣️</div>
      <div className={styles.floatingDecoration15}>회화</div>
      <div className={styles.floatingDecoration16}>📝</div>
      <div className={styles.floatingDecoration17}>Nice</div>
      <div className={styles.floatingDecoration18}>💡</div>
      <div className={styles.floatingDecoration19}>Learn</div>
      <div className={styles.floatingDecoration20}>🎓</div>
      <div className={styles.floatingDecoration21}>대화</div>
      <div className={styles.floatingDecoration22}>🌈</div>
      <div className={styles.floatingDecoration23}>Speak</div>
      <div className={styles.floatingDecoration24}>🔥</div>

      <div className={styles.Container}>
        <div className={styles.FormSection}>
          {/* 떠다니는 오리 */}
          <img src={duckTogether} alt="Duck Together" className={styles.floatingDuck} />

          <div className={styles.TitleWrapper}>
            <h1 className={styles.MainTitle}>
              <img src={duckLogo} alt="수다Duck 로고" className={styles.LogoImage} />
              <span className={styles.titleChar}>수</span>
              <span className={styles.titleChar}>다</span>
              <span className={styles.duckText}>Duck</span>
            </h1>
          </div>

          <div className={styles.FormContent}>
            <div className={styles.HeroImageContainer}>
              <img src={duckHappy} alt="행복한 오리" className={styles.HeroImage} />
            </div>

            <p className={styles.WelcomeText}>
              "일상 대화 기반 AI분석 영어 회화 서비스"
            </p>
            <p className={styles.Subtitle}>
              카카오 계정으로 간편하게 시작하세요!
            </p>

            <button
              type="button"
              className={styles.KakaoButton}
              onClick={handleKakaoLogin}
            >
              <img src={kakaoIcon} alt="카카오톡 아이콘" className={styles.KakaoIcon} />
              <span>카카오로 시작하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}