import { useState, useEffect, useRef } from "react";
import styles from "./TipBanner.module.css";

export default function TipBanner({ text }) {
  const cleanInputText = (text || "ì§€ê¸?ë°”ë¡œ ?¨ê»˜ ?˜ê¸° ëª¨ë“œë¡??¤ì–´ê°€ ë³¼ê¹Œ??")
    .replace(/^Tip:\s*/i, "")
    .replace(/[?˜Š?”?ŒðŸ¦†ðŸ“?$/u, "") 
    .trim();

  const tips = [
    { txt: cleanInputText, emo: "?˜Š" },
    { txt: "?¬ì‹¤ ë§ˆìŠ¤ì½”íŠ¸???”ê¸°????´?¼ëŠ” ?Œë¬¸???ˆìŠµ?ˆë‹¤", emo: "?”" },
    { txt: "ë¹„ë°©???¤ì–´ê°??œëª©?´ë‚˜ ì£¼ì œë¡œëŠ” ë°©ì„ ë§Œë“¤ ???†ì–´??, emo: "?? },
    { txt: "ë§¤ì¼ë§¤ì¼ ê¾¸ì????™ìŠµ?˜ë©´ ?¤ë¦¬ê°€ ???‰ë³µ?´í•´??, emo: "?¦†" },
    { txt: "ë§ˆì´?˜ì´ì§€?ì„œ ?´ê? ?€?¥í•œ ë¬¸ìž¥?¤ì„ ë³µìŠµ?´ë³´?¸ìš”", emo: "?“" },
  ];

  const extendedTips = [...tips, tips[0]];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, 2000);

    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (currentIndex === extendedTips.length - 1) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(0);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, extendedTips.length]);

  return (
    <div className={styles.Banner} role="note" aria-label="??>
      <div className={styles.FixedLabel}>Tip</div>
      
      <div className={styles.SlotWindow}>
        <div 
          className={styles.RouletteContent} 
          style={{ 
            transform: `translateY(-${currentIndex * 100}%)`,
            transition: isTransitioning ? "transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)" : "none"
          }}
        >
          {extendedTips.map((tip, index) => (
            <div key={index} className={styles.TipItem}>
              <div className={styles.ContentGroup}>
                {/* ?¼ìª½ ?´ëª¨ì§€ ?œê±°, ë¬¸ìž¥ê³??¤ë¥¸ìª??´ëª¨ì§€ë§?? ì? */}
                <span className={styles.Text}>{tip.txt}</span>
                <span className={styles.Emoji}>{tip.emo}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.GlassShine} />
      <div className={styles.BottomShadow} />
    </div>
  );
}
