import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';
import { loginWithKakao } from "@/api/auth";

// Importing images
import duckHappy from '../../assets/images/duck_happy.png';
import duckTogether from '../../assets/images/duck_together.png';
import duckBotCyan from '../../assets/images/duck_bot_cyan.png';
import profile1 from '../../assets/images/duck_profile1.png';
import profile2 from '../../assets/images/duck_profile2.png';
import profile3 from '../../assets/images/duck_profile3.png';
import profile4 from '../../assets/images/duck_profile4.png';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  
  const containerRef = useRef(null);
  const overviewRef = useRef(null);
  const featuresRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      setIsAtTop(scrollY < 20);

      if (!showContent || !containerRef.current) return;

      const calculateRotate = (ref, maxRotate) => {
        if (!ref.current) return maxRotate;
        const rect = ref.current.getBoundingClientRect();
        
        let progress = 1 - (rect.top / windowHeight);
        progress = Math.min(Math.max(progress, 0), 1);
        
        return maxRotate * (1 - progress);
      };

      const overviewRotate = calculateRotate(overviewRef, -10); 
      containerRef.current.style.setProperty('--overview-rotate', `${overviewRotate}deg`);
      
      const featuresRotate = calculateRotate(featuresRef, 10);
      containerRef.current.style.setProperty('--features-rotate', `${featuresRotate}deg`);

      // 4. CTA Logic (Card 4) - Same dynamic tilt
      const ctaRotate = calculateRotate(ctaRef, -10); // Tilt left initially
      containerRef.current.style.setProperty('--cta-rotate', `${ctaRotate}deg`);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showContent]);

  const handleStart = () => {
    loginWithKakao();
  };

  return (
    <div 
      ref={containerRef}
      className={styles.container} 
      style={{ 
        minHeight: '100vh',
        '--overview-rotate': '-10deg', 
        '--features-rotate': '10deg',
        '--cta-rotate': '-10deg'
      }}
    >
      
      {/* Noise Texture Overlay */}
      <div className={styles.noiseOverlay}></div>

      {/* Hero Section - Card 1 */}
      <section className={`${styles.section} ${styles.heroSection}`}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            <span className={styles.char} style={{ animationDelay: '0.1s' }}>수</span>
            <span className={styles.char} style={{ animationDelay: '0.6s' }}>다</span>
            <span className={`${styles.char} ${styles.duckText}`} style={{ animationDelay: '1.1s' }}>DUCK</span>
          </h1>
          
          <div className={`${styles.fadeWrapper} ${showContent ? styles.visible : ''}`}>
            <p className={styles.subTitle}>
              실시간 스크립트 생성 & 회화 학습 음성 채팅
            </p>
            <p className={styles.catchyPhrase}>
              "수다 떨었을 뿐인데, 영어 공부가 끝났다?"
            </p>
            <div className={styles.heroImageContainer}>
              <img src={duckHappy} alt="SudaDuck Happy" className={styles.heroImage} />
            </div>
          </div>
        </div>
        
        <div className={`${styles.scrollIndicator} ${showContent && isAtTop ? styles.visible : ''}`}>
          SCROLL DOWN
        </div>
      </section>

      {showContent && (
        <>
          {/* Overview Section - Card 2 */}
          <section 
            ref={overviewRef} 
            className={`${styles.section} ${styles.overviewSection}`}
            style={{ transform: 'rotate(var(--overview-rotate))' }}
          >
            <div className={styles.cardContent}>
              <h2 className={styles.sectionTitle}>서비스 개요</h2>
              <div className={styles.overviewFlex}>
                <div className={styles.overviewTextContainer}>
                  <img src={duckTogether} alt="Duck Together" className={styles.overviewImageInside} />
                  <p className={styles.overviewText}>
                    친구들과의 수다가 영어 스크립트가 됩니다.<br/>
                    딱딱한 교재가 아닌, 내 이야기로 영어를 배우세요.
                  </p>
                  <p className={styles.overviewText}>
                    AI와의 1:1 대화부터 그룹 회화까지,<br/>
                    즐거운 소통이 학습이 되는 경험을 드립니다.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section - Card 3 */}
          <section 
            ref={featuresRef} 
            className={`${styles.section} ${styles.featuresSection}`}
            style={{ transform: 'rotate(var(--features-rotate))' }}
          >
             <div className={styles.cardContent}>
              <h2 className={styles.sectionTitle}>주요 기능</h2>
              <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                  <img src={profile1} alt="Shadowing" className={styles.featureImage} />
                  <h3 className={styles.featureTitle}>실시간 쉐도잉</h3>
                  <p className={styles.featureDesc}>내 대화가 즉시<br/>스크립트가 됩니다.</p>
                </div>
                <div className={styles.featureCard}>
                  <img src={profile2} alt="AI Assistant" className={styles.featureImage} />
                  <h3 className={styles.featureTitle}>AI 보조 진행자</h3>
                  <p className={styles.featureDesc}>끊김 없는 대화를<br/>위한 AI 서포트.</p>
                </div>
                <div className={styles.featureCard}>
                  <img src={profile3} alt="Minigame" className={styles.featureImage} />
                  <h3 className={styles.featureTitle}>미니게임 & 퀴즈</h3>
                  <p className={styles.featureDesc}>대화 중 터지는<br/>돌발 미션!</p>
                </div>
                <div className={styles.featureCard}>
                  <img src={profile4} alt="Modes" className={styles.featureImage} />
                  <h3 className={styles.featureTitle}>싱글 & 그룹</h3>
                  <p className={styles.featureDesc}>혼자서도,<br/>친구와도 즐겁게.</p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section - Card 4 */}
          <section 
            ref={ctaRef} 
            className={`${styles.section} ${styles.ctaSection}`}
            style={{ transform: 'rotate(var(--cta-rotate))' }}
          >
            <div className={styles.cardContent}>
              <h2 className={styles.sectionTitle} style={{color: 'white', borderColor: 'white'}}>지금 바로 시작하세요!</h2>
              <img src={duckBotCyan} alt="Duck Bot" className={styles.ctaImage} />
              <p className={styles.overviewText} style={{color: 'white'}}>
                저장된 핵심 문장으로 언제든 복습하고,<br/>
                나만의 영어 실력을 완성해보세요.
              </p>
              <button onClick={handleStart} className={styles.ctaButton}>
                카카오로 시작하기
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default LandingPage;
