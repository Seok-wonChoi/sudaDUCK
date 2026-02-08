import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ModeSelectSection.module.css";
import ModeCard from "@/components/common/ModeCard/ModeCard";

export default function ModeSelectSection({ onClickPractice, onClickTogether }) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(1); // '?¨ê»˜?˜ê¸°'ë¥?ê¸°ë³¸ ì¤‘ì•™?¼ë¡œ ?¤ì •

  const cards = [
    {
      id: "practice",
      title: "?°ìŠµ ëª¨ë“œ",
      description: "?¸í•˜ê²??°ìŠµ?˜ê³  ?¤ë ¥???“ì•„ë³´ì„¸??,
      variant: "practice",
      disabled: true,
      disabledMessage: "?„ì§ ?¤í”ˆ ?ˆì •?…ë‹ˆ????",
      action: onClickPractice
    },
    {
      id: "together",
      title: "?¨ê»˜?˜ê¸°",
      description: "ì¹œêµ¬?¤ê³¼ ?¨ê»˜ ?˜ë‹¤ ?¨ë©° ?ì–´ ê³µë??˜ê¸°",
      variant: "together",
      disabled: false,
      action: onClickTogether
    },
    {
      id: "mypage",
      title: "ë§ˆì´?˜ì´ì§€",
      description: "?´ê? ?™ìŠµ??ë¬¸ìž¥?¤ì„ ëª¨ì•„ë³´ê³  ë³µìŠµ?˜ì„¸??,
      variant: "mypage",
      disabled: false,
      action: () => navigate("/mypage")
    }
  ];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? cards.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === cards.length - 1 ? 0 : prev + 1));
  };

  const handleCardClick = (index, action) => {
    if (index === activeIndex) {
      action();
    } else {
      setActiveIndex(index);
    }
  };

  const getCardClass = (index) => {
    if (index === activeIndex) return styles.Active;
    
    const diff = index - activeIndex;
    if (diff === -1 || diff === 2) return styles.Left;
    if (diff === 1 || diff === -2) return styles.Right;
    
    return "";
  };

  return (
    <section className={styles.Section} aria-label="?™ìŠµ ëª¨ë“œ ? íƒ">
      {/* ?¼ìª½ ?”ì‚´??(SVGë¡?êµµê²Œ) */}
      <button className={`${styles.Arrow} ${styles.ArrowLeft}`} onClick={handlePrev} aria-label="?´ì „ ëª¨ë“œ">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <div className={styles.CarouselContainer}>
        {cards.map((card, index) => (
          <div 
            key={card.id} 
            className={`${styles.CardWrapper} ${getCardClass(index)}`}
            onClick={() => handleCardClick(index, card.action)}
          >
            <ModeCard
              title={card.title}
              description={card.description}
              variant={card.variant}
              disabled={card.disabled}
              disabledMessage={card.disabledMessage}
              isActive={index === activeIndex}
              onClick={() => {}} 
            />
          </div>
        ))}
      </div>

      {/* ?¤ë¥¸ìª??”ì‚´??(SVGë¡?êµµê²Œ) */}
      <button className={`${styles.Arrow} ${styles.ArrowRight}`} onClick={handleNext} aria-label="?¤ìŒ ëª¨ë“œ">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </section>
  );
}
