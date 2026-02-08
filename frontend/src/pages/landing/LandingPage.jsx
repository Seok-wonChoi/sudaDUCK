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

  // �??�역 ?��???간섭???�전??차단?�는 격리 로직 (?�립??보장)
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    
    // ?�재 ?�역 ?��???백업
    const originalHtmlOverflow = html.style.overflow;
    const originalHtmlHeight = html.style.height;
    const originalBodyOverflow = body.style.overflow;
    const originalBodyHeight = body.style.height;

    // ?�딩?�이지 ?�용 ?�린 ?�크�??�경 강제 ?�정
    html.style.overflow = 'visible';
    html.style.height = 'auto';
    body.style.overflow = 'visible';
    body.style.height = 'auto';

    return () => {
      // ?�이지�??�날 ???�역 ?��???복구 (2�?충돌 방�?)
      html.style.overflow = originalHtmlOverflow;
      html.style.height = originalHtmlHeight;
      body.style.overflow = originalBodyOverflow;
      body.style.height = originalBodyHeight;
    };
  }, []);

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

      // �?검증된 ?�리지???�전 로직
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

      const ctaRotate = calculateRotate(ctaRef, -10);
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
        <div className={styles.heroContent} >
          <h1 
  className={styles.title} 
  style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: '0px'
  }}
>
  <span 
    className={styles.char} 
    style={{ animationDelay: '0.1s', margin: '0' }}
  >
    ??
  </span>
  <span 
    className={styles.char} 
    style={{ animationDelay: '0.6s', margin: '0' }}
  >
    ??
  </span>
  
  <span 
    className={`${styles.char} ${styles.duckText}`} 
    style={{ 
      animationDelay: '1.1s', 
      margin: '0', 
      marginLeft: '10px'
    }}
  >
    DUCK
  </span>
</h1>
          
          <div className={`${styles.fadeWrapper} ${showContent ? styles.visible : ''}`}>
            <p className={styles.subTitle}>
              ?�시�??�크립트 ?�성 & ?�화 ?�습 ?�성 채팅
            </p>
            <p className={styles.catchyPhrase}>
              "?�다 ?�었??뿐인?? ?�어 공�?가 ?�났??"
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
              <h2 className={styles.sectionTitle}>?�비??개요</h2>
              <div className={styles.overviewFlex}>
                <div className={styles.overviewTextContainer}>
                  <img src={duckTogether} alt="Duck Together" className={styles.overviewImageInside} />
                  <p className={styles.overviewText}>
                    친구?�과???�다가 ?�어 ?�크립트가 ?�니??<br/>
                    ?�딱??교재가 ?�닌, ???�야기로 ?�어�?배우?�요.
                  </p>
                  <p className={styles.overviewText}>
                    AI?�??1:1 ?�?��???그룹 ?�화까�?,<br/>
                    즐거???�통???�습???�는 경험???�립?�다.
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
                  <h3 className={styles.featureTitle}>?�시�??�도??/h3>
                  <p className={styles.featureDesc}>???�?��? 즉시<br/>?�크립트가 ?�니??</p>
                </div>
                <div className={styles.featureCard}>
                  <img src={profile2} alt="AI Assistant" className={styles.featureImage} />
                  <h3 className={styles.featureTitle}>AI 보조 진행??/h3>
                  <p className={styles.featureDesc}>?��? ?�는 ?�?��?<br/>?�한 AI ?�포??</p>
                </div>
                <div className={styles.featureCard}>
                  <img src={profile3} alt="Minigame" className={styles.featureImage} />
                  <h3 className={styles.featureTitle}>미니게임 & ?�즈</h3>
                  <p className={styles.featureDesc}>?�??�??��???br/>?�발 미션!</p>
                </div>
                <div className={styles.featureCard}>
                  <img src={profile4} alt="Modes" className={styles.featureImage} />
                  <h3 className={styles.featureTitle}>?��? & 그룹</h3>
                  <p className={styles.featureDesc}>?�자?�도,<br/>친구?�??즐겁�?</p>
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
              <h2 className={styles.sectionTitle} style={{color: 'white', borderColor: 'white'}}>지�?바로 ?�작?�세??</h2>
              <img src={duckBotCyan} alt="Duck Bot" className={styles.ctaImage} />
              <p className={styles.overviewText} style={{color: 'white'}}>
                ?�?�된 ?�심 문장?�로 ?�제??복습?�고,<br/>
                ?�만???�어 ?�력???�성?�보?�요.
              </p>
              <button onClick={handleStart} className={styles.ctaButton}>
                카카?�로 ?�작?�기
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default LandingPage;
