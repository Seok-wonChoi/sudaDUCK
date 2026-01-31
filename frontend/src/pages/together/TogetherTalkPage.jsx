import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./TogetherTalkPage.module.css";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import ExitGuard from "@/components/common/ExitGuard/ExitGuard";
import ExitButton from "@/components/common/ExitButton/ExitButton";
import TimerGauge from "@/components/common/TimerGauge/TimerGauge";

import {
  leaveRoom,
  startSilenceMonitoring,
  stopSilenceMonitoring,
  recordVoiceActivity,
  getRoomLobby,
} from "@/api/rooms";
import useRoomWebSocket from "@/hooks/useRoomWebSocket";

import duckImg from "@/assets/images/duck.png";
import duckBotCyanImg from "@/assets/images/duck_bot_cyan.png";
import duckHappyImg from "@/assets/images/duck_happy.png";
import duckBombImg from "@/assets/images/duck_bomb.png";
import duckSadImg from "@/assets/images/duck_sad.png";
import micOnIcon from "@/assets/icons/mic_on.png";
import micOffIcon from "@/assets/icons/mic_off.png";

import UnexpectedQuestOverlay from "@/components/features/unexpected-quest/UnexpectedQuestOverlay";
import UnexpectedQuestFillBlankModal from "@/components/features/unexpected-quest/UnexpectedQuestFillBlankModal";

const ROOM_INFO_KEY = "together_room_info";

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

function safeParseJson(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function getUserIdFromToken() {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );

    const payload = JSON.parse(jsonPayload);
    return (
      payload.memberId ??
      payload.userId ??
      payload.id ??
      payload.user_id ??
      payload.sub ??
      null
    );
  } catch {
    return null;
  }
}

export default function TogetherTalkPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [hydratedInfo, setHydratedInfo] = useState(() => {
    if (location.state) return location.state;

    const saved = sessionStorage.getItem(ROOM_INFO_KEY);
    const parsed = saved ? safeParseJson(saved) : null;
    return parsed ?? null;
  });

  useEffect(() => {
    if (location.state) {
      setHydratedInfo(location.state);
      try {
        sessionStorage.setItem(ROOM_INFO_KEY, JSON.stringify(location.state));
      } catch {
        // ignore
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (!hydratedInfo) {
      navigate("/together", { replace: true });
    }
  }, [hydratedInfo, navigate]);

  const roomInfo = hydratedInfo ?? {};

  const resolvedRoomCode = useMemo(() => {
    return (
      roomInfo.roomCode ||
      roomInfo.inviteCode ||
      roomInfo.joinCode ||
      roomInfo.code ||
      roomInfo.roomInfo?.roomCode ||
      ""
    );
  }, [roomInfo]);

  const [topic, setTopic] = useState(roomInfo.topic ?? "좋아하는 음식");
  const [maxCount, setMaxCount] = useState(roomInfo.maxCount ?? 4);

  const [roomId, setRoomId] = useState(roomInfo.roomId ?? null);
  const [currentTurn, setCurrentTurn] = useState(roomInfo.currentTurn ?? 1);

  const myUserId = useMemo(() => {
    return roomInfo.myUserId ?? getUserIdFromToken();
  }, [roomInfo.myUserId]);

  const [participants, setParticipants] = useState(() => {
    const raw = Array.isArray(roomInfo.participants)
      ? roomInfo.participants
      : [];
    return raw.map((p) => ({
      id: p.id ?? p.email ?? "unknown",
      name: p.name ?? p.nickname ?? "참여자",
      isMe: p.isMe === true,
      micOn: p.micOn ?? false,
    }));
  });

  const syncLobby = useCallback(async () => {
    if (!resolvedRoomCode) return;

    try {
      const data = await getRoomLobby(resolvedRoomCode);

      if (data?.topic) setTopic(data.topic);
      if (data?.roomId) setRoomId(data.roomId);

      const members = Array.isArray(data?.participants)
        ? data.participants
        : [];

      const myIdStr = myUserId != null ? String(myUserId) : null;

      const mapped = members.map((m) => {
        const idStr = String(m.userId ?? "");
        return {
          id: idStr || "unknown",
          name: m.nickname ?? "참여자",
          isMe: myIdStr ? idStr === myIdStr : false,
          micOn: m.micOn ?? false,
        };
      });

      if (mapped.length > 0) {
        setParticipants(mapped);
      }

      if (data?.maxCount) {
        setMaxCount(data.maxCount);
      }
    } catch (e) {
      console.error("[TogetherTalkPage] getRoomLobby 실패:", e);
    }
  }, [resolvedRoomCode, myUserId]);

  useEffect(() => {
    syncLobby();
  }, [syncLobby]);

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
  const [aiSuggestion, setAiSuggestion] = useState("");

  const aiTimeoutRef = useRef(null);

  const handleConversationSuggestion = useCallback((question) => {
    setAiSuggestion(question || "");

    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }

    aiTimeoutRef.current = setTimeout(() => {
      setAiSuggestion("");
      aiTimeoutRef.current = null;
    }, 10000);
  }, []);

  useEffect(() => {
    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
    };
  }, []);

  useRoomWebSocket(resolvedRoomCode, {
    onConversationSuggestion: handleConversationSuggestion,
    onConnected: () => console.log("WebSocket 연결됨 (TogetherTalkPage)"),
    onDisconnected: () =>
      console.log("WebSocket 연결 해제됨 (TogetherTalkPage)"),
  });

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
      } catch {
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
      } catch {
        // ignore
      }

      tick();
    } catch {
      setIsSpeaking(false);
      setVoiceLevel(0);
    }
  }, []);

  useEffect(() => {
    startAudioAnalysis();

    if (roomId && currentTurn) {
      startSilenceMonitoring(roomId, currentTurn).catch((e) => {
        console.error("정적 감지 시작 실패:", e);
      });
    }

    return () => {
      stopAudioAnalysis();

      if (roomId) {
        stopSilenceMonitoring(roomId).catch((e) => {
          console.error("정적 감지 중지 실패:", e);
        });
      }
    };
  }, [startAudioAnalysis, stopAudioAnalysis, roomId, currentTurn]);

  useEffect(() => {
    if (isSpeaking && roomId && myUserId && currentTurn) {
      recordVoiceActivity(roomId, myUserId, currentTurn).catch((e) => {
        console.error("음성 활동 기록 실패:", e);
      });
    }
  }, [isSpeaking, roomId, myUserId, currentTurn]);

  const toggleMic = useCallback(async () => {
    if (micOn) {
      setMicOn(false);
      await stopAudioAnalysis();
      return;
    }
    setMicOn(true);
    await startAudioAnalysis();
  }, [micOn, startAudioAnalysis, stopAudioAnalysis]);

  const doLeaveRoom = useCallback(async () => {
    await stopAudioAnalysis();

    if (roomId) {
      try {
        await stopSilenceMonitoring(roomId);
      } catch (e) {
        console.error("정적 감지 중지 실패:", e);
      }
    }

    if (resolvedRoomCode) {
      try {
        await leaveRoom({ roomCode: resolvedRoomCode });
      } catch (e) {
        console.error("방 퇴장 API 호출 실패:", e);
      }
    }
  }, [stopAudioAnalysis, roomId, resolvedRoomCode]);

  const handleEnd = useCallback(async () => {
    await doLeaveRoom();

    navigate("/recording", {
      replace: true,
      state: {
        mode: "together",
        roomInfo,
        participants,
      },
    });
  }, [doLeaveRoom, navigate, roomInfo, participants]);

  const handleDone = useCallback(async () => {
    await doLeaveRoom();
    navigate("/main", { replace: true });
  }, [doLeaveRoom, navigate]);

  // 중복/문법 오류가 있던 handleBack은 하나만 남깁니다.
  const handleBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/together");
  }, [navigate]);

  /* =========================
     돌발 퀘스트 (수동 시작 1/2)
  ========================= */
  const [isRoomTimerRunning, setIsRoomTimerRunning] = useState(true);

  const [activeQuest, setActiveQuest] = useState(null); // 1 | 2 | null
  const [questStep, setQuestStep] = useState("idle"); // idle | q1intro | q1ready | q1showQuestion | q1answering | intro | q2game | resultFail | resultSuccess
  const [isCorrect, setIsCorrect] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const questRunning = questStep !== "idle";

  const endQuestAndResume = useCallback(() => {
    setActiveQuest(null);
    setQuestStep("idle");
    setIsRoomTimerRunning(true);
    setCountdown(3);
  }, []);

  const startQuest = useCallback(
    (id) => {
      if (questRunning) return;

      if (id !== 1 && id !== 2) return;

      setActiveQuest(id);
      setIsRoomTimerRunning(false);

      if (id === 1) {
        setQuestStep("q1intro");
        return;
      }

      // id === 2
      setQuestStep("intro");
    },
    [questRunning],
  );

  const handleOverlayClickNext = useCallback(() => {
    // 퀘스트 1: intro → ready(countdown) → showQuestion → answering → (결과는 추후 처리)
    if (questStep === "q1intro" && activeQuest === 1) {
      setQuestStep("q1ready");
      setCountdown(3);
      return;
    }

    if (questStep === "q1showQuestion" && activeQuest === 1) {
      setQuestStep("q1answering");
      return;
    }

    // 퀘스트 2: intro → q2game(모달)
    if (questStep === "intro" && activeQuest === 2) {
      setQuestStep("q2game");
      return;
    }

    // 결과 화면 클릭 시 종료
    if (questStep === "resultFail" || questStep === "resultSuccess") {
      endQuestAndResume();
    }
  }, [questStep, activeQuest, endQuestAndResume]);

  // 퀘스트 1: 카운트다운 자동 진행
  useEffect(() => {
    if (questStep !== "q1ready" || activeQuest !== 1) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setQuestStep("q1showQuestion");
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [questStep, activeQuest]);

  // 퀘스트 1: 영어 문장 표시 후 3초 뒤 자동으로 answering 전환(원하면 클릭으로도 전환 가능)
  useEffect(() => {
    if (questStep !== "q1showQuestion" || activeQuest !== 1) return;

    const timer = setTimeout(() => {
      setQuestStep("q1answering");
    }, 3000);

    return () => clearTimeout(timer);
  }, [questStep, activeQuest]);

  const handleSubmitQuest2 = useCallback(() => {
    const correct = Math.random() > 0.5;
    setIsCorrect(correct);
    setQuestStep(correct ? "resultSuccess" : "resultFail");
  }, []);

  // 퀘스트 텍스트
  const quest1IntroTitle = "돌발 퀘스트!!";
  const quest1IntroBody = "영어로만 답해야 해!!\n모두 협동해서 점수를 얻어봐";
  const quest1ReadyText = "다들 준비는 됐나?";
  const quest1English = "What is your favorite food?";

  const quest2IntroTitle = "돌발 퀘스트!!\n빈칸을 채워봐.";
  const quest2IntroSub = "가장 먼저 맞힌 사람이 점수를 얻어.";

  const isSuccess = questStep === "resultSuccess";
  const failText = "아쉽게도 성공하지 못했어\n다음 번 기회를 노려봐!";
  const successText = "대단해!! 점수를 획득했어!!";

  const resultBubbleText = isSuccess ? successText : failText;
  const resultDuckSrc = isSuccess ? duckHappyImg : duckSadImg;

  // 오버레이 표시 조건
  const showQuest1Intro = questStep === "q1intro" && activeQuest === 1;
  const showQuest1Ready = questStep === "q1ready" && activeQuest === 1;
  const showQuest1ShowQuestion =
    questStep === "q1showQuestion" && activeQuest === 1;
  const showQuest1Answering = questStep === "q1answering" && activeQuest === 1;

  const showQuest2Intro = questStep === "intro" && activeQuest === 2;
  const showQuest2Game = questStep === "q2game" && activeQuest === 2;

  const showResultOverlay =
    (questStep === "resultFail" || questStep === "resultSuccess") &&
    (activeQuest === 1 || activeQuest === 2);

  return (
    <div className={styles.Page}>
      <div className={styles.Shell}>
        <ExitGuard />

        <AppHeader userName="user" notifications={[]} />

        <div className={styles.Content}>
          <button
            className={styles.BackButton}
            type="button"
            onClick={handleBack}
            aria-label="뒤로 가기"
          >
            &lt;
          </button>

          <div className={styles.HeaderRow}>
            <div className={styles.ExitCol}>
              <ExitButton
                to="/"
                replace
                label="나가기"
                confirmMessage="메인 화면으로 나가시겠습니까?"
                onExit={doLeaveRoom}
              />
            </div>

            <div className={styles.TopicRow}>
              <img className={styles.SmallDuck} src={duckImg} alt="오리" />
              <div className={styles.TopicBubble}>
                첫 번째 대화 주제는 {topic}입니다!
              </div>
            </div>

            <div className={styles.TimerCol}>
              <TimerGauge
                durationMs={60_000}
                isRunning={isRoomTimerRunning}
                onDone={handleDone}
              />
              <div
                className={styles.QuestButtons}
                aria-label="돌발 퀘스트 시작 버튼"
              >
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
              </div>
            </div>
          </div>

          <div className={styles.Stage}>
            <div className={styles.LeftStage}>
              {showQuest1Answering && (
                <div className={styles.Quest1Banner}>
                  <div className={styles.Quest1BannerQuestion}>
                    {quest1English}
                  </div>
                </div>
              )}

              <section
                className={styles.CardsGrid}
                aria-label="참여자 영상 영역"
              >
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
                  const participantMicOn = isMe ? micOn : (p.micOn ?? false);

                  return (
                    <div
                      key={p.id}
                      className={`${styles.VideoCard} ${
                        isMe && isSpeaking
                          ? styles.VideoCardSpeaking
                          : styles.VideoCardIdle
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
                          <span className={styles.MeLabel}>{p.name}</span>
                          <img
                            className={styles.MicMini}
                            src={participantMicOn ? micOnIcon : micOffIcon}
                            alt={
                              participantMicOn ? "마이크 켜짐" : "마이크 꺼짐"
                            }
                          />
                        </div>

                        <div className={styles.VideoFooterRight}>
                          {isMe ? (
                            <VoiceWave level={voiceLevel} enabled={micOn} />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>

              <div className={styles.BottomActions}>
                <button
                  type="button"
                  className={styles.PrimaryButton}
                  onClick={toggleMic}
                >
                  <img
                    className={styles.ButtonIcon}
                    src={micOn ? micOnIcon : micOffIcon}
                    alt=""
                    aria-hidden="true"
                  />
                  {micOn ? "마이크 끄기" : "마이크 켜기"}
                </button>

                <button
                  type="button"
                  className={styles.SecondaryButton}
                  onClick={handleEnd}
                >
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

                {aiSuggestion ? (
                  <>
                    <div className={styles.AiMainText}>대화 추천</div>
                    <div className={styles.AiSubText}>{aiSuggestion}</div>
                  </>
                ) : (
                  <>
                    <div className={styles.AiMainText}>
                      영어로 편하게 대화해보세요!
                    </div>
                    <div className={styles.AiSubText}>
                      15초 동안 침묵이 지속되면 제가 도와드릴게요.
                    </div>
                  </>
                )}

                <div className={styles.AiPointer} aria-hidden="true" />
              </div>

              <img
                className={styles.BigDuck}
                src={duckBotCyanImg}
                alt="AI 오리"
              />
            </aside>
          </div>
        </div>

        {/* 퀘스트 1: 인트로 */}
        <UnexpectedQuestOverlay
          open={showQuest1Intro}
          onClose={handleOverlayClickNext}
          duckSrc={duckBombImg}
          bubbleTitle={quest1IntroTitle}
          bubbleText={quest1IntroBody}
          subText={null}
          subTone="danger"
          countdownNumber={undefined}
          speechBubbleType={2}
          clickAnywhere
          showCloseButton={false}
          escToClose={false}
        />

        {/* 퀘스트 1: 준비 + 카운트다운 */}
        <UnexpectedQuestOverlay
          open={showQuest1Ready}
          onClose={handleOverlayClickNext}
          duckSrc={duckBombImg}
          bubbleText={quest1ReadyText}
          subText={null}
          subTone="normal"
          countdownNumber={countdown}
          speechBubbleType={2}
          clickAnywhere={false}
          showCloseButton={false}
          escToClose={false}
        />

        {/* 퀘스트 1: 영어 문장 표시 */}
        <UnexpectedQuestOverlay
          open={showQuest1ShowQuestion}
          onClose={handleOverlayClickNext}
          duckSrc={duckBombImg}
          bubbleText={quest1English}
          subText="영어로만 답해야 해!!!"
          subTone="danger"
          countdownNumber={undefined}
          speechBubbleType={2}
          clickAnywhere
          showCloseButton={false}
          escToClose={false}
        />

        {/* 퀘스트 2: 인트로 */}
        <UnexpectedQuestOverlay
          open={showQuest2Intro}
          onClose={handleOverlayClickNext}
          duckSrc={duckBombImg}
          bubbleText={quest2IntroTitle}
          subText={quest2IntroSub}
          subTone="danger"
          countdownNumber={undefined}
          clickAnywhere
          showCloseButton={false}
          escToClose={false}
        />

        {/* 퀘스트 2: 게임 화면 */}
        <UnexpectedQuestFillBlankModal
          open={showQuest2Game}
          duckSrc={duckBombImg}
          onSubmit={handleSubmitQuest2}
        />

        {/* 결과 */}
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
