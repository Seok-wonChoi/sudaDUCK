import { useState, useEffect, useRef } from "react";
import styles from "./TipBanner.module.css";

export default function TipBanner({ text }) {
  const cleanInputText = (text || "지금 바로 함께 하기 모드로 들어가 볼까요?")
    .replace(/^Tip:\s*/i, "")
    .replace(/[😊🐔❌🦆📝]$/u, "") 
    .trim();

  const tips = [
    { txt: cleanInputText, emo: "😊" },
    { txt: "사실 마스코트인 더기는 닭이라는 소문이 있습니다", emo: "🐔" },
    { txt: "비방이 들어간 제목이나 주제로는 방을 만들 수 없어요", emo: "❌" },
    { txt: "매일매일 꾸준히 학습하면 오리가 더 행복해해요", emo: "🦆" },
    { txt: "마이페이지에서 내가 저장한 문장들을 복습해보세요", emo: "📝" },
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
    <div className={styles.Banner} role="note" aria-label="팁">
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
                {/* 왼쪽 이모지 제거, 문장과 오른쪽 이모지만 유지 */}
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