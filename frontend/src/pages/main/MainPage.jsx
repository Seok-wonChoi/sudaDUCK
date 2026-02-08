import { useState, useEffect } from "react";
import styles from "./MainPage.module.css";
import { useNavigate, useLocation } from "react-router-dom";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import MainHero from "@/components/features/main/MainHero/MainHero";
import ModeSelectSection from "@/components/features/main/ModeSelectSection/ModeSelectSection";
import TipBanner from "@/components/common/TipBanner/TipBanner";
import StatsSection from "@/components/features/main/StatsSection/StatsSection";
import { getMyProfileCustom, getMypageSummary } from "@/api/mypage";

export default function MainPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state ?? {};
  const initialSummary = state.summary;
  const [summary, setSummary] = useState(() =>
    initialSummary ?? { attendanceDays: 0, sentenceCount: 0 }
  );
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");


  // ? ìŠ¤??ë©”ì‹œì§€ ?œì‹œ
  useEffect(() => {
    if (location.state?.toastMessage) {
      const message = location.state.toastMessage;
      setToastMessage(message);
      setToastVisible(true);

      // 3ì´????ë™?¼ë¡œ ?¬ë¼ì§?
      const timer = setTimeout(() => {
        setToastVisible(false);
      }, 3000);

      // location state ?•ë¦¬
      navigate(location.pathname, {
        replace: true,
        state: { ...state, toastMessage: undefined },
      });


      // ??cleanup?€ location??ë°”ë€??Œë§ˆ???¤í–‰?˜ëŠ”??
      // navigateë¥??¸ì¶œ?˜ë©´ location??ë°”ë€Œì–´???€?´ë¨¸ê°€ ë°”ë¡œ ì·¨ì†Œ?˜ëŠ” ë²„ê·¸ê°€ ?ˆì—ˆ??
      // ?°ë¼???¬ê¸°?œëŠ” ?¸ë§ˆ?´íŠ¸ ?œì—ë§??•ë¦¬?˜ë„ë¡??˜ê±°?? ?€?´ë¨¸ë¥?? ì??´ì•¼ ??
      return () => {
        // ë§Œì•½ ?˜ì´ì§€ë¥??„ì˜ˆ ? ë‚˜??ê²ƒì´?¼ë©´ ?•ë¦¬, 
        // ?˜ì?ë§?navigate(replace)??ê°™ì? ì»´í¬?ŒíŠ¸ë¥?? ì??˜ë?ë¡?ì£¼ì˜ ?„ìš”.
        // ?¬ê¸°?œëŠ” ?¨ìˆœ??clearTimeout???œê±°?˜ê±°?? 
        // ?˜ì¡´??ë°°ì—´?ì„œ location??ë¹¼ê³  location.state.toastMessageë§?ê°ì‹œ?˜ëŠ” ê²ƒì´ ?˜ìŒ.
      };
    }
  }, [location.state?.toastMessage, navigate, location.pathname]);


  // ë¡œê·¸?????¬ìš©???„ë¡œ??ë¡œë“œ (?‰ë„¤????
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profileData = await getMyProfileCustom();
        if (profileData.nickname) {
          localStorage.setItem('userNickname', profileData.nickname);
          window.dispatchEvent(new Event('nicknameUpdated'));
        }

        const summaryData = await getMypageSummary();
        if (summaryData) {
          setSummary({
            attendanceDays: summaryData.attendanceDays ?? 0,
            sentenceCount: summaryData.sentenceCount ?? 0,
          });
        }
      } catch (error) {
        console.error("?„ë¡œ??ë¡œë“œ ?¤íŒ¨:", error);
      }
    };

    // accessToken???ˆìœ¼ë©??„ë¡œ??ë¡œë“œ
    const token = localStorage.getItem('accessToken');
    if (token) {
      loadUserProfile();
    }
  }, []);

  const handlePractice = () => {
    navigate("/practice");
  };

  const handleTogether = () => {
    navigate("/together", { state: { summary } });
  };


  return (
    <div className={styles.Page}>
      {/* ? ìŠ¤??ë©”ì‹œì§€ (?”ë©´ ?ë‹¨) */}
      {toastVisible && (
        <div className={styles.Toast}>
          {toastMessage}
        </div>
      )}

      <div className={styles.Shell}>
        <AppHeader userName="user" notifications={[]} />

        <div className={styles.Top}>
          <MainHero />
          <ModeSelectSection
            onClickPractice={handlePractice}
            onClickTogether={handleTogether}
          />
        </div>

        <div className={styles.Bottom}>
          <TipBanner text="Tip: ì§€ê¸?ë°”ë¡œ ?¨ê»˜ ?˜ê¸° ëª¨ë“œë¡??¤ì–´ê°€ ë³¼ê¹Œ?? ?˜Š" />
          <StatsSection
            stats={[
              { value: "?”¥", label: "?¤ëŠ˜???´ì‹¬???´ë³¼ê¹Œìš”?" },
              { value: `${summary.attendanceDays}??, label: "?°ì† ?™ìŠµ" },
              { value: `${summary.sentenceCount}ê°?, label: "?€?¥ëœ ë¬¸ì¥" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
