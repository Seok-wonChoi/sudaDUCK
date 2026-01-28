import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./TogetherTalkPage.module.css";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import ExitGuard from "@/components/common/ExitGuard/ExitGuard";
import ExitButton from "@/components/common/ExitButton/ExitButton";
import TimerGauge from "@/components/common/TimerGauge/TimerGauge";

import duckImg from "@/assets/images/duck.png";
import duckHappyImg from "@/assets/images/duck_happy.png";
import duckBombImg from "@/assets/images/duck_bomb.png";
import duckSadImg from "@/assets/images/duck_sad.png";
import micOnIcon from "@/assets/icons/mic_on.png";
import micOffIcon from "@/assets/icons/mic_off.png";

import UnexpectedQuestOverlay from "@/components/features/unexpected-quest/UnexpectedQuestOverlay";
import UnexpectedQuestFillBlankModal from "@/components/features/unexpected-quest/UnexpectedQuestFillBlankModal";

function VoiceWave({ level, enabled }) {
  const multipliers = useMemo(() => [0.5, 0.7, 0.85, 1, 0.85, 0.7, 0.5], []);
  const v = Math.max(0, Math.min(1, level));

  return (
    <span
      className={`${styles.Wave} ${enabled ? styles.WaveOn : styles.WaveOff}`}
      aria-hidden="true"
    >
      {multipliers.map((m, idx) => {
        const h = enabled ? 10 + v * 16 * m : 10;
        return (
          <span
            key={idx}
            className={`${styles.WaveBar} ${styles[`WaveBar${idx + 1}`]}`}
            style={{ height: `${h}px` }}
          />
        );
      })}
    </span>
  );
}

export default function TogetherTalkPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  useEffect(() => {
    if (!state) {
      navigate("/together", { replace: true });
    }
  }, [state, navigate]);

  const roomInfo = state ?? {};
  const topic = roomInfo.topic ?? "좋아하는 음식";
  const maxCount = roomInfo.maxCount ?? 4;

  const participants = useMemo(() => {
    const raw = Array.isArray(roomInfo.participants) ? roomInfo.participants : [];
    if (raw.length > 0) {
      return raw.map((p, idx) => ({
        id: p.id ?? `u${idx + 1}`,
        name: p.name ?? `참여자 ${idx + 1}`,
        isMe: p.id === "me" || p.isMe === true,
      }));
    }
    return [
      { id: "me", name: "나", isMe: true },
      { id: "u2", name: "참여자 1", isMe: false },
      { id: "u3", name: "참여자 2", isMe: false },
      { id: "u4", name: "참여자 3", isMe: false },
    ];
  }, [roomInfo.participants]);

  const slots = useMemo(() => {
    const arr = [];
    for (let i = 0; i < maxCount; i += 1) {
      const p = participants[i];
      if (p) arr.push({ kind: "filled", p });
      else arr.push({ kind: "empty", id: `empty-${i + 1}` });
    }
    return arr;
  }, [maxCount, participants]);

  const [micOn, setMicOn] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);

  const audioRef = useRef({
    stream: null,
    ctx: null,
    analyser: null,
    source: null,
    rafId: null,
    lastVoiceAt: 0,
    speakingNow: false,
    level: 0,
    lastUiAt: 0,
  });

  const stopAudioAnalysis = useCallback(async () => {
    const a = audioRef.current;

    if (a.rafId) {
      cancelAnimationFrame(a.rafId);
      a.rafId = null;
    }

    if (a.stream) {
      a.stream.getTracks().forEach((t) => t.stop());
      a.stream = null;
    }

    if (a.ctx) {
      try {
        await a.ctx.close();
      } catch (e) {
        // ignore
      }
      a.ctx = null;
    }

    a.analyser = null;
    a.source = null;
    a.lastVoiceAt = 0;
    a.speakingNow = false;
    a.level = 0;
    a.lastUiAt = 0;

    setIsSpeaking(false);
    setVoiceLevel(0);
  }, []);

  const startAudioAnalysis = useCallback(async () => {
    const a = audioRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      a.stream = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      a.ctx = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.85;
      a.analyser = analyser;

      const source = ctx.createMediaStreamSource(stream);
      a.source = source;
      source.connect(analyser);

      const data = new Float32Array(analyser.fftSize);

      const THRESHOLD = 0.03;
      const HOLD_MS = 220;
      const UI_INTERVAL_MS = 60;

      const tick = () => {
        if (!a.analyser) return;

        if (typeof a.analyser.getFloatTimeDomainData === "function") {
          a.analyser.getFloatTimeDomainData(data);

          let sum = 0;
          for (let i = 0; i < data.length; i += 1) {
            const v = data[i];
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);

          const now = performance.now();

          if (rms > THRESHOLD) a.lastVoiceAt = now;
          const speaking = now - a.lastVoiceAt < HOLD_MS;

          if (speaking !== a.speakingNow) {
            a.speakingNow = speaking;
            setIsSpeaking(speaking);
          }

          const raw = Math.max(0, Math.min(1, (rms - 0.005) / 0.08));
          a.level = a.level * 0.82 + raw * 0.18;

          if (now - a.lastUiAt > UI_INTERVAL_MS) {
            a.lastUiAt = now;
            setVoiceLevel(a.level);
          }
        }

        a.rafId = requestAnimationFrame(tick);
      };

      try {
        await ctx.resume();
      } catch (e) {
        // ignore
      }

      tick();
    } catch (e) {
      setIsSpeaking(false);
      setVoiceLevel(0);
    }
  }, []);

  useEffect(() => {
    // 페이지 로드 시 마이크 자동 켜기
    startAudioAnalysis();

    return () => {
      stopAudioAnalysis();
    };
  }, [startAudioAnalysis, stopAudioAnalysis]);

  const toggleMic = useCallback(async () => {
    if (micOn) {
      setMicOn(false);
      await stopAudioAnalysis();
      return;
    }
    setMicOn(true);
    await startAudioAnalysis();
  }, [micOn, startAudioAnalysis, stopAudioAnalysis]);

  const handleEnd = useCallback(async () => {
    await stopAudioAnalysis();
    navigate("/", { replace: true });
  }, [navigate, stopAudioAnalysis]);

  const handleDone = useCallback(() => {
    console.log("시간 종료");
  }, []);

  /* =========================
     돌발 퀘스트 (수동 시작 1/2/3)
     - 버튼 없는 화면: 클릭으로 다음
     - 2번 입력 화면: 버튼으로 다음
     - 진행 동안 TimerGauge 정지, 종료 후 재개
  ========================= */
  const [isRoomTimerRunning, setIsRoomTimerRunning] = useState(true);

  const [activeQuest, setActiveQuest] = useState(null); // 1 | 2 | 3 | null
  // idle | intro | q2game | q3intro | q3meaning | resultFail | resultSuccess
  const [questStep, setQuestStep] = useState("idle");

  const questRunning = questStep !== "idle";

  const endQuestAndResume = useCallback(() => {
    setActiveQuest(null);
    setQuestStep("idle");
    setIsRoomTimerRunning(true);
  }, []);

  const startQuest = useCallback(
    (id) => {
      if (questRunning) return;

      setActiveQuest(id);
      setIsRoomTimerRunning(false);

      if (id === 1 || id === 2) {
        setQuestStep("intro");
        return;
      }

      if (id === 3) {
        setQuestStep("q3intro");
      }
    },
    [questRunning]
  );

  const handleOverlayClickNext = useCallback(() => {
    // 1/2번 인트로
    if (questStep === "intro") {
      if (activeQuest === 1) setQuestStep("resultFail");
      if (activeQuest === 2) setQuestStep("q2game");
      return;
    }

    // 3번 첫 화면 -> 문장/뜻 화면
    if (questStep === "q3intro") {
      setQuestStep("q3meaning");
      return;
    }

    // 3번 문장/뜻 화면 -> 결과 실패
    if (questStep === "q3meaning") {
      setQuestStep("resultFail");
      return;
    }

    // 결과 실패 -> 결과 성공
    if (questStep === "resultFail") {
      setQuestStep("resultSuccess");
      return;
    }

    // 결과 성공 -> 복귀
    if (questStep === "resultSuccess") {
      endQuestAndResume();
    }
  }, [questStep, activeQuest, endQuestAndResume]);

  const handleSubmitQuest2 = useCallback(() => {
    setQuestStep("resultFail");
  }, []);

  // 1번 인트로(영어 문장 하드코딩)
  const quest1English = "Dd duck says: This is a random English sentence.";

  // 2번 인트로
  const quest2IntroTitle = "돌발 퀘스트!!\n빈칸을 채워요.";
  const quest2IntroSub = "가장 먼저 맞힌 사람이 점수를 얻어요.";

  // 3번 첫 화면(이미지 1)
  const quest3IntroTitle = "돌발 퀘스트!!\n단어의 뜻을 맞춰요.";
  const quest3IntroSub = "모두 협동해서 점수를 얻어보아요.";

  // 3번 두 번째 화면(이미지 2)
  const quest3EnglishSentence = "I couldn't agree with you more on that point.";
  const quest3KoreanMeaning = "그 점에 대해서 당신의 말에 전적으로 동의합니다.";

  // 결과 텍스트: 2번(랭킹), 1/3번(점수)
  const isQuest2 = activeQuest === 2;
  const isSuccess = questStep === "resultSuccess";

  const failText = isQuest2
    ? "아쉽게도 1등 하지 못했어요\n다음 번 기회를 노려봐요!"
    : "아쉽게도 성공하지 못했어요\n다음 번 기회를 노려봐요!";

  const successText = isQuest2
    ? "대단해요!! 1등이에요!!"
    : "대단해요!! 점수를 획득했어요!!";

  const resultBubbleText = isSuccess ? successText : failText;
  const resultDuckSrc = isSuccess ? duckHappyImg : duckSadImg;

  const showIntroOverlay = questStep === "intro" && (activeQuest === 1 || activeQuest === 2);
  const showQuest2Game = questStep === "q2game" && activeQuest === 2;

  const showQuest3IntroOverlay = questStep === "q3intro" && activeQuest === 3;
  const showQuest3MeaningOverlay = questStep === "q3meaning" && activeQuest === 3;

  const showResultOverlay =
    (questStep === "resultFail" || questStep === "resultSuccess") &&
    (activeQuest === 1 || activeQuest === 2 || activeQuest === 3);

  return (
    <div className={styles.Page}>
      <div className={styles.Shell}>
        <ExitGuard />

        <AppHeader userName="user" notifications={[]} />

        <div className={styles.Content}>
          <div className={styles.HeaderRow}>
            <div className={styles.ExitCol}>
              <ExitButton
                to="/"
                replace
                label="나가기"
                confirmMessage="메인 화면으로 나가시겠습니까?"
                onExit={() => {
                  stopAudioAnalysis();
                }}
              />
            </div>

            <div className={styles.TopicRow}>
              <img className={styles.SmallDuck} src={duckImg} alt="오리" />
              <div className={styles.TopicBubble}>첫 번째 대화 주제는 {topic}입니다!</div>
            </div>

            <div className={styles.TimerCol}>
              <TimerGauge
                durationMs={60_000}
                isRunning={isRoomTimerRunning}
                onDone={handleDone}
              />
              <div className={styles.QuestButtons} aria-label="돌발 퀘스트 시작 버튼">
                <button
                  type="button"
                  className={styles.QuestBtn}
                  onClick={() => startQuest(1)}
                  disabled={questRunning}
                  aria-label="돌발 퀘스트 1 시작"
                >
                  1
                </button>
                <button
                  type="button"
                  className={styles.QuestBtn}
                  onClick={() => startQuest(2)}
                  disabled={questRunning}
                  aria-label="돌발 퀘스트 2 시작"
                >
                  2
                </button>
                <button
                  type="button"
                  className={styles.QuestBtn}
                  onClick={() => startQuest(3)}
                  disabled={questRunning}
                  aria-label="돌발 퀘스트 3 시작"
                >
                  3
                </button>
              </div>
            </div>
          </div>

          <div className={styles.Stage}>
          <div className={styles.LeftStage}>
            <section className={styles.CardsGrid} aria-label="참여자 영상 영역">
              {slots.map((slot) => {
                if (slot.kind === "empty") {
                  return (
                    <div
                      key={slot.id}
                      className={`${styles.VideoCard} ${styles.VideoCardEmpty}`}
                    >
                      <div className={styles.EmptyText}>빈 자리</div>
                    </div>
                  );
                }

                const p = slot.p;
                const isMe = p.isMe === true;

                return (
                  <div
                    key={p.id}
                    className={`${styles.VideoCard} ${
                      isMe && isSpeaking ? styles.VideoCardSpeaking : styles.VideoCardIdle
                    }`}
                  >
                    <div className={styles.VideoInner}>
                      <div className={styles.AvatarCircle}>
                        <img
                          className={styles.AvatarDuck}
                          src={duckImg}
                          alt={`${p.name} 아바타`}
                        />
                      </div>
                    </div>

                    <div className={styles.VideoFooter}>
                      <div className={styles.VideoFooterLeft}>
                        {isMe ? <VoiceWave level={voiceLevel} enabled={micOn} /> : null}
                        <span className={styles.MeLabel}>{p.name}</span>
                      </div>

                      <div className={styles.VideoFooterRight} aria-label="마이크 상태">
                        {isMe ? (
                          <img
                            className={styles.MicMini}
                            src={micOn ? micOffIcon : micOnIcon}
                            alt={micOn ? "마이크 켜짐" : "마이크 꺼짐"}
                          />
                        ) : (
                          <img
                            className={`${styles.MicMini} ${styles.MicMuted}`}
                            src={micOffIcon}
                            alt="마이크 꺼짐"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <div className={styles.BottomActions}>
              <button type="button" className={styles.PrimaryButton} onClick={toggleMic}>
                <img
                  className={styles.ButtonIcon}
                  src={micOn ? micOffIcon : micOnIcon}
                  alt=""
                  aria-hidden="true"
                />
                {micOn ? "마이크 끄기" : "마이크 켜기"}
              </button>

              <button type="button" className={styles.SecondaryButton} onClick={handleEnd}>
                대화 종료
              </button>
            </div>
          </div>

          <aside className={styles.RightStage} aria-label="AI 도우미">
            <div className={styles.AiBubble}>
              <div className={styles.AiHeader}>
                <span className={styles.AiDot} aria-hidden="true" />
                <span className={styles.AiTitle}>AI 영어덕</span>
                <span className={styles.AiDot} aria-hidden="true" />
              </div>

              <div className={styles.AiFace} aria-hidden="true">
                🙂
              </div>

              <div className={styles.AiMainText}>영어로 편하게 대화해보세요!</div>
              <div className={styles.AiSubText}>
                5초 동안 침묵이 지속되면 제가 도와드릴게요.
              </div>

              <div className={styles.AiPointer} aria-hidden="true" />
            </div>

            <img className={styles.BigDuck} src={duckHappyImg} alt="AI 오리" />
          </aside>
        </div>
        </div>

        {/* 1/2번 인트로 오버레이: 클릭으로 다음 */}
        <UnexpectedQuestOverlay
          open={showIntroOverlay}
          onClose={handleOverlayClickNext}
          duckSrc={duckBombImg}
          bubbleText={activeQuest === 1 ? quest1English : quest2IntroTitle}
          subText={activeQuest === 2 ? quest2IntroSub : null}
          subTone={activeQuest === 2 ? "danger" : "normal"}
          countdownNumber={undefined}
          clickAnywhere
          showCloseButton={false}
          escToClose={false}
        />

        {/* 2번: 빈칸 입력 화면(버튼으로 진행) */}
        <UnexpectedQuestFillBlankModal
          open={showQuest2Game}
          duckSrc={duckBombImg}
          onSubmit={handleSubmitQuest2}
        />

        {/* 3번: 첫 화면(이미지1) */}
        <UnexpectedQuestOverlay
          open={showQuest3IntroOverlay}
          onClose={handleOverlayClickNext}
          duckSrc={duckBombImg}
          bubbleText={quest3IntroTitle}
          subText={quest3IntroSub}
          subTone="danger"
          countdownNumber={undefined}
          clickAnywhere
          showCloseButton={false}
          escToClose={false}
        />

        {/* 3번: 두 번째 화면(이미지2) - 영어 문장 + 한글 뜻 */}
        <UnexpectedQuestOverlay
          open={showQuest3MeaningOverlay}
          onClose={handleOverlayClickNext}
          duckSrc={duckBombImg}
          bubbleText={`영어 문장\n${quest3EnglishSentence}`}
          subText={`한글 해석\n${quest3KoreanMeaning}`}
          subTone="normal"
          countdownNumber={undefined}
          clickAnywhere
          showCloseButton={false}
          escToClose={false}
        />

        {/* 결과 오버레이: 클릭으로 실패 -> 성공 -> 복귀 */}
        <UnexpectedQuestOverlay
          open={showResultOverlay}
          onClose={handleOverlayClickNext}
          duckSrc={resultDuckSrc}
          bubbleText={resultBubbleText}
          subText={null}
          subTone="normal"
          countdownNumber={undefined}
          clickAnywhere
          showCloseButton={false}
          escToClose={false}
        />
      </div>
    </div>
  );
}
