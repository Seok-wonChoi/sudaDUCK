import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import MiniGameLayout from '@/components/features/minigame/layout/MiniGameLayout';
import CountdownOverlay from '@/components/features/minigame/countdown/CountdownOverlay';
import QuestionPanel from '@/components/features/minigame1/question/QuestionPanel';
import WaitingPanel from '@/components/features/minigame1/waiting/WaitingPanel';
import ResultPanel from '@/components/features/minigame1/result/ResultPanel';
import ReviewPanel from '@/components/features/minigame1/review/ReviewPanel';
import DuckGuide from '@/components/features/minigame2/game/DuckGuide';
import CoinRewardNotification from '@/components/features/minigame/CoinReward/CoinRewardNotification';
import { getReviewQuestions, submitReviewAnswers, getReviewRanking, clearReviewData } from '@/api/miniGame';
import { getMyProfileCustom } from '@/api/mypage';
import { leaveRoom, getRoomLobby } from '@/api/rooms';
import useMicAnalyzer from '@/hooks/useMicAnalyzer';
import useRoomWebSocket from '@/hooks/useRoomWebSocket';
import { useOpenVidu } from '@/context/OpenViduContext'; // 👈 OpenVidu Hook 추가

const GAME_PHASE = {
  COUNTDOWN: 'countdown',
  PLAYING: 'playing',
  WAITING: 'waiting',
  RESULT: 'result',
  REVIEW: 'review',
};

/**
 * blank_script 파싱 함수
 */
function parseBlankScript(blankScript) {
  if (!blankScript) {
    return { parts: [], answers: [] };
  }

  const parts = [];
  const answers = [];
  let currentPart = '';
  let i = 0;

  while (i < blankScript.length) {
    if (blankScript[i] === '[') {
      parts.push(currentPart);
      currentPart = '';
      const closeIdx = blankScript.indexOf(']', i);
      if (closeIdx === -1) break;
      const answer = blankScript.substring(i + 1, closeIdx);
      answers.push(answer);
      i = closeIdx + 1;
    } else {
      currentPart += blankScript[i];
      i++;
    }
  }
  if (currentPart) {
    parts.push(currentPart);
  }

  return { parts, answers };
}

export default function MiniGame1Page() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 👇 OpenVidu Context 연결
  const { publisher, subscribers } = useOpenVidu();

  // Location state에서 초기값 가져오기
  const roomId = location.state?.roomId;
  const roomCode = location.state?.roomCode;
  const isHost = location.state?.isHost || false;
  const initialParticipantsCount = location.state?.participantsCount || 1;
  const timeLimit = location.state?.timeLimit || 40;
  
  const [phase, setPhase] = useState(GAME_PHASE.COUNTDOWN);
  const [countdown, setCountdown] = useState(3);
  const [timer, setTimer] = useState(timeLimit);

  // 🎤 [추가] 미니게임 진입 시 마이크 무조건 활성화
  useEffect(() => {
    if (publisher) {
      console.log("🎤 [MiniGame1] 마이크 활성화");
      publisher.publishAudio(true);
    }
  }, [publisher]);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentBlank, setCurrentBlank] = useState(0);
  const [blanksState, setBlanksState] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [showGuide, setShowGuide] = useState(false);
  const [showCoinReward, setShowCoinReward] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rankings, setRankings] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(initialParticipantsCount);

  // 마이크 분석기 - 음성 레벨 감지
  const { isSpeaking, voiceLevel, start: startMic, stop: stopMic } = useMicAnalyzer({
    threshold: 0.03,
    holdMs: 220,
  });

  // 마이크 시작 (게임 진행 중 및 리뷰 화면)
  useEffect(() => {
    if (phase === GAME_PHASE.PLAYING || phase === GAME_PHASE.REVIEW || phase === GAME_PHASE.RESULT) {
      startMic();
    } else {
      stopMic();
    }
  }, [phase, startMic, stopMic]);

  // 음성 레벨 맵 (throttle 적용 - 200ms)
  const [voiceLevelsMap, setVoiceLevelsMap] = useState({});

  // 웹소켓 연결 - 음성 레벨 동기화
  const handleVoiceLevelChanged = useCallback((payload) => {
    const { key, level } = payload;
    if (!key) return;

    setVoiceLevelsMap((prev) => ({
      ...prev,
      [key]: level || 0,
    }));

    // 일정 시간 후 자동으로 0으로 설정
    setTimeout(() => {
      setVoiceLevelsMap((prev) => ({
        ...prev,
        [key]: 0,
      }));
    }, 500);
  }, []);

  const { sendVoiceLevel, isConnected } = useRoomWebSocket(roomCode, {
    onVoiceLevelChanged: handleVoiceLevelChanged,
    onConnected: () => {
      console.log('[MiniGame1] ✅ WebSocket 연결 성공');
    },
    onDisconnected: () => {
      console.log('[MiniGame1] ❌ WebSocket 연결 해제');
    },
  });

  // 내 음성 레벨 전송 (throttle 적용)
  const lastLocalSentRef = useRef({ at: 0, level: 0 });

  useEffect(() => {
    if (!isConnected) return;
    if (!isSpeaking && voiceLevel < 0.05) return;

    const now = Date.now();
    const last = lastLocalSentRef.current;

    if (now - last.at < 120) return;
    if (Math.abs(voiceLevel - last.level) < 0.02) return;

    lastLocalSentRef.current = { at: now, level: voiceLevel };
    if (voiceLevel > 0) sendVoiceLevel(voiceLevel);
  }, [voiceLevel, isSpeaking, isConnected, sendVoiceLevel]);

  // 내 음성 레벨을 로컬 voiceLevelsMap에도 추가 (즉시 UI 반영)
  useEffect(() => {
    const myParticipant = participants.find(p => p.isMe);
    if (!myParticipant) return;

    if (isSpeaking && voiceLevel >= 0.05) {
      // 말하고 있을 때
      setVoiceLevelsMap((prev) => ({
        ...prev,
        [myParticipant.key]: voiceLevel,
      }));

      // 일정 시간 후 자동으로 0으로 설정
      const timeout = setTimeout(() => {
        setVoiceLevelsMap((prev) => ({
          ...prev,
          [myParticipant.key]: 0,
        }));
      }, 500);

      return () => clearTimeout(timeout);
    } else {
      // 말하지 않을 때는 0으로 설정
      setVoiceLevelsMap((prev) => ({
        ...prev,
        [myParticipant.key]: 0,
      }));
    }
  }, [isSpeaking, voiceLevel, participants]);

  // 🔥 문제 5 해결: 방 참가자 정보 초기 로드
  useEffect(() => {
    const loadRoomParticipants = async () => {
      if (!roomCode) return;
      
      try {
        const lobbyData = await getRoomLobby(roomCode);
        console.log('📊 방 참가자 정보 로드:', lobbyData);
        
        if (lobbyData && lobbyData.members && Array.isArray(lobbyData.members)) {
          const participantsList = lobbyData.members.map(member => ({
            key: String(member.userId || member.memberId || ''),
            id: member.userId || member.memberId,
            userId: member.userId || member.memberId,
            name: member.nickname,
            nickname: member.nickname,
            profileImageUrl: member.profileImageUrl,
            avatar: member.profileImageUrl,
            isActive: true,
            isMe: member.isMe || false,
            voiceLevel: 0,

            duckCustomJson: member.duckCustomJson || null,
            avatarCustomJson: member.avatarCustomJson || null,
          }));
          
          console.log('✅ 참가자 목록 설정:', participantsList);
          setParticipants(participantsList);
          setTotalParticipants(participantsList.length);

          const me = participantsList.find(p => p.isMe);

          if (me) {
            setMyProfile({
              nickname: me.nickname,
              profileImageUrl: me.profileImageUrl
            });
          }
        }
      } catch (error) {
        console.error('❌ 방 참가자 정보 로드 실패:', error);
      }
    };

    loadRoomParticipants();
  }, [roomCode]);

  useEffect(() => {
    const fetchMyProfileDetail = async () => {
      try {
        // API 호출하여 내 커스텀 정보 가져오기
        const myData = await getMyProfileCustom();
        console.log("🦆 내 오리 정보 로드:", myData);

        if (myData) {
          setMyProfile({
            nickname: myData.nickname,
            // profileImageUrl: myData.profileImageUrl, // API 응답에 없으면 생략 가능
            duckCustomJson: myData.duckCustomJson,     // 👈 핵심
            avatarCustomJson: myData.avatarCustomJson, // 👈 닉네임 꾸미기용
            aiDuckbotCustomJson: myData.aiDuckbotCustomJson
          });
          
          // participants 목록에도 내 정보 업데이트 (동기화)
          setParticipants(prev => prev.map(p => 
            p.isMe ? { 
              ...p, 
              duckCustomJson: myData.duckCustomJson,
              avatarCustomJson: myData.avatarCustomJson
            } : p
          ));
        }
      } catch (error) {
        console.error("❌ 내 프로필 로드 실패:", error);
      }
    };

    fetchMyProfileDetail();
  }, []); // 마운트 시 1회 실행


  // 🔥 문제 3 해결: 대기 중 제출 상태 확인 (3초마다)
  useEffect(() => {
    if (phase !== GAME_PHASE.WAITING) return;

    const checkSubmissionStatus = async () => {
      try {
        const rankingData = await getReviewRanking(roomId);
        
        console.log('📊 대기 상태 확인:', {
          rankingData: rankingData.length,
          totalParticipants,
          제출여부: rankingData.map(r => ({ 이름: r.nickname, 점수: r.score }))
        });
        
        if (rankingData && Array.isArray(rankingData)) {
          // 제출한 사람 수 계산 (점수가 있는 사람)
          const submittedUsers = rankingData.filter(r => r.score > 0 || r.hasSubmitted);
          setSubmittedCount(submittedUsers.length);
          
          // [수정] 랭킹 데이터에 참가자 정보(오리 커스텀 등)를 병합
          const mergedRankings = rankingData.map(rank => {
            // ID로 매칭 (문자열로 변환하여 비교)
            const participantInfo = participants.find(p => 
              String(p.userId) === String(rank.userId)
            );

            // 해당 유저를 찾았다면 그 유저의 duckCustomJson을 사용
            return {
              ...rank,
              duckCustomJson: participantInfo?.duckCustomJson || null,
              avatarCustomJson: participantInfo?.avatarCustomJson || null // 닉네임 효과도 있다면 추가
            };
          });
          
          // 랭킹 데이터로 참가자 정보 업데이트
          const updatedParticipants = rankingData.map(rank => ({
            id: rank.userId || rank.nickname,
            userId: rank.userId || rank.nickname,
            name: rank.nickname,
            nickname: rank.nickname,
            profileImageUrl: rank.profileImageUrl,
            avatar: rank.profileImageUrl,
            isActive: true,
            isMe: rank.isMe || false,
            voiceLevel: 0,
          }));
          
          // 기존 참가자 정보와 병합
          setParticipants(prevParticipants => {
            const updatedMap = new Map();
            
            prevParticipants.forEach(p => {
              updatedMap.set(p.userId, p);
            });
            
            updatedParticipants.forEach(p => {
              updatedMap.set(p.userId, { ...updatedMap.get(p.userId), ...p });
            });
            
            return Array.from(updatedMap.values());
          });
          
          // 모든 참가자가 제출했으면 결과 화면으로
          if (rankingData.length >= totalParticipants && totalParticipants > 0) {
            setRankings(mergedRankings);
            setPhase(GAME_PHASE.RESULT);
          }
        }
      } catch (error) {
        console.error('❌ 제출 상태 확인 실패:', error);
      }
    };

    checkSubmissionStatus();
    const interval = setInterval(checkSubmissionStatus, 3000);
    
    return () => clearInterval(interval);
  }, [phase, roomId, totalParticipants, participants]);

  useEffect(() => {
    const fetchData = async () => {
      if (!roomId) {
        console.error('roomId가 없습니다');
        navigate('/together');
        return;
      }

      try {
        setIsLoading(true);

        const questionsData = await getReviewQuestions(roomId);

        console.log('📊 받아온 문제 데이터:', questionsData);

        // scriptId 기준으로 중복 제거
        const uniqueQuestionsMap = new Map();
        questionsData.forEach(item => {
          if (!uniqueQuestionsMap.has(item.scriptId)) {
            uniqueQuestionsMap.set(item.scriptId, item);
          }
        });
        const uniqueQuestions = Array.from(uniqueQuestionsMap.values());

        console.log(`📊 중복 제거: ${questionsData.length}개 → ${uniqueQuestions.length}개`);

        // 유효한 문제 필터링
        const validQuestions = uniqueQuestions.filter(
          item => {
            if (item.scriptId === 'scores') return false;
            if (!item.blank_script || !item.korean || !item.english) return false;

            const hasBlanks = item.blank_script.includes('[') && item.blank_script.includes(']');
            if (!hasBlanks) {
              console.warn('❌ 빈칸이 없는 문제 제외:', item);
            }
            return hasBlanks;
          }
        );

        console.log('📊 필터링 후 문제 수:', validQuestions.length);

        const formattedQuestions = validQuestions.map((item) => {
          const { parts, answers } = parseBlankScript(item.blank_script);

          if (answers.length === 0) {
            console.warn('❌ 빈칸 파싱 실패:', item.blank_script);
            return null;
          }

          return {
            scriptId: item.scriptId,
            korean: item.korean,
            english: item.english,
            englishParts: parts,
            blanks: answers.map((ans) => ({ answer: ans.trim() })),
          };
        }).filter(Boolean);

        console.log('✅ 최종 문제 목록:', formattedQuestions);

        if (formattedQuestions.length === 0) {
          console.error('유효한 문제가 없습니다');
          alert('문제를 불러올 수 없습니다.');
          navigate('/together');
          return;
        }

        setQuestions(formattedQuestions);
        initQuestion(0, formattedQuestions);
        setIsLoading(false);
      } catch (error) {
        console.error('❌ 데이터 가져오기 실패:', error);
        setIsLoading(false);
        navigate('/together');
      }
    };

    fetchData();
  }, [roomId, navigate]);


  // [추가] 대기방(채팅방)으로 돌아가기
  const handleReturnToRoom = async () => {
    try {
      if (roomCode) {
        navigate('/together/waiting', {
          state: {
            ...location.state, // 여기에 openviduSessionId 등 중요 정보가 들어있음
            roomCode,
            roomId,
            isHost,
            // WaitingRoomPage는 sessionStorage도 확인하지만, 
            // state로 명시적으로 넘겨주는 것이 더 안전합니다.
          }
        });
      } else {
        console.warn("⚠️ [MiniGame] roomCode가 없어 로비로 이동합니다.");
        navigate('/together'); // 뒤로 가기(-1) 대신 로비로 안전하게 이동
      }
    } catch (error) {
      console.error('❌ 대기방 이동 중 에러:', error);
      navigate('/together');
    }
  };

  const initQuestion = useCallback((qIdx, qs = questions) => {
    const q = qs[qIdx];
    if (!q) return;

    const initialBlanks = q.blanks.map(() => ({
      value: '',
      status: 'empty',
    }));

    setBlanksState(initialBlanks);
    setCurrentBlank(0);
  }, [questions]);

  useEffect(() => {
    if (phase !== GAME_PHASE.COUNTDOWN) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setPhase(GAME_PHASE.PLAYING);
          setShowGuide(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== GAME_PHASE.PLAYING) return;

    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          handleTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase === GAME_PHASE.PLAYING && showGuide) {
      const id = setTimeout(() => setShowGuide(false), 3000);
      return () => clearTimeout(id);
    }
  }, [phase, showGuide]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleBlankChange = useCallback((blankIdx, value) => {
    setBlanksState((prev) => {
      const next = [...prev];
      next[blankIdx] = {
        value: value,
        status: 'empty',
      };
      return next;
    });
  }, []);

  const handleBlankClick = useCallback((blankIdx) => {
    setCurrentBlank(blankIdx);
  }, []);

  const handleBlankSubmit = useCallback((blankIdx) => {
    const q = questions[currentQuestion];
    if (!q) return;

    const userAnswer = blanksState[blankIdx]?.value || '';

    setBlanksState((prev) => {
      const next = [...prev];
      next[blankIdx] = {
        value: userAnswer,
        status: 'filled',
      };
      return next;
    });

    if (currentBlank < q.blanks.length - 1) {
      setCurrentBlank(prev => prev + 1);
    } else {
      const answered = {
        scriptId: q.scriptId,
        koreanSentence: q.korean,
        englishSentence: q.english,
        englishParts: q.englishParts,
        blanks: q.blanks.map((b, idx) => {
          const userAns = blanksState[idx]?.value || '';
          const correctAns = b.answer;
          const isCorrect = userAns.trim().toLowerCase() === correctAns.trim().toLowerCase();
          return {
            answer: correctAns,
            userAnswer: userAns,
            isCorrect: isCorrect,
          };
        }),
      };

      setAnsweredQuestions((prev) => [...prev, answered]);

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        initQuestion(currentQuestion + 1);
      } else {
        submitAnswers([...answeredQuestions, answered]);
      }
    }
  }, [currentQuestion, currentBlank, questions, blanksState, answeredQuestions, initQuestion]);

  const handleTimeUp = useCallback(() => {
    const finalAnswers = [...answeredQuestions];
    
    if (currentQuestion < questions.length) {
      const q = questions[currentQuestion];
      const answered = {
        scriptId: q.scriptId,
        koreanSentence: q.korean,
        englishSentence: q.english,
        englishParts: q.englishParts,
        blanks: q.blanks.map((b, idx) => {
          const userAns = blanksState[idx]?.value || '';
          const correctAns = b.answer;
          const isCorrect = userAns.trim().toLowerCase() === correctAns.trim().toLowerCase();
          return {
            answer: correctAns,
            userAnswer: userAns,
            isCorrect: isCorrect,
          };
        }),
      };
      finalAnswers.push(answered);
    }
    setAnsweredQuestions(finalAnswers);
    submitAnswers(finalAnswers);
  }, [answeredQuestions, currentQuestion, questions, blanksState]);

  const submitAnswers = async (answers) => {
    try {
      const apiAnswers = answers.map(ans => ({
        scriptId: ans.scriptId,
        userAnswer: ans.blanks.map(b => b.userAnswer || '').join(', ')
      }));

      console.log('📤 답안 제출:', apiAnswers);

      const response = await submitReviewAnswers(roomId, apiAnswers);
      
      setSubmitResult({
        message: response.message || '제출 완료!',
        correctCount: response.correctCount || 0,
        totalQuestions: questions.length,
      });

      setPhase(GAME_PHASE.WAITING);
    } catch (error) {
      console.error('❌ 답안 제출 실패:', error);
      alert('답안 제출에 실패했습니다.');
    }
  };

  const handleShowReview = async () => {
    setPhase(GAME_PHASE.REVIEW);
  };

  const handleBackToResult = () => {
    setPhase(GAME_PHASE.RESULT);
  };

  const handleExit = async () => {
    try {
      if (roomCode) {
        await leaveRoom({ roomCode });
      }
      
      await clearReviewData(roomId);
      
      navigate('/together');
    } catch (error) {
      console.error('방 나가기 에러:', error);
      navigate('/together');
    }
  };

  if (isLoading) {
    return (
      <MiniGameLayout disableProfileClick={true}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          로딩 중...
        </div>
      </MiniGameLayout>
    );
  }

  const currentQuestionData = questions[currentQuestion];

  return (
    <MiniGameLayout
      showGameHeader={phase !== GAME_PHASE.REVIEW}
      participants={participants}
      voiceLevels={voiceLevelsMap}
      onExit={handleExit}
      timer={phase === GAME_PHASE.PLAYING ? formatTime(timer) : null}
      progress={phase === GAME_PHASE.PLAYING ? timer : 0}
      totalProgress={timeLimit}
      isReviewMode={phase === GAME_PHASE.REVIEW}
      onComplete={phase === GAME_PHASE.REVIEW ? handleBackToResult : null}
      disableProfileClick={true}
    >
      {/* 👇 상대방 소리를 재생하기 위한 오디오 컴포넌트 추가 */}
      {subscribers.map((sub) => (
        <div key={sub.stream.connection.connectionId} style={{ display: 'none' }}>
          <UserAudioComponent streamManager={sub} />
        </div>
      ))}

      {phase === GAME_PHASE.COUNTDOWN && (
        <CountdownOverlay count={countdown} />
      )}

      {phase === GAME_PHASE.PLAYING && (
        <>
          {showGuide && (
            <DuckGuide 
              message="빈칸을 채우고 Enter를 누르세요!"
            />
          )}
          <QuestionPanel
            current={currentQuestion + 1}
            total={questions.length}
            koreanSentence={currentQuestionData?.korean || ''}
            englishParts={currentQuestionData?.englishParts || []}
            blanks={blanksState}
            currentBlankIndex={currentBlank}
            onBlankChange={handleBlankChange}
            onBlankSubmit={handleBlankSubmit}
            onBlankClick={handleBlankClick}
          />
        </>
      )}

      {phase === GAME_PHASE.WAITING && (
        <WaitingPanel
          message={submitResult?.message || '다른 참가자를 기다리는 중...'}
          correctCount={submitResult?.correctCount || 0}
          totalQuestions={submitResult?.totalQuestions || questions.length}
          submittedCount={submittedCount}
          totalParticipants={totalParticipants}
        />
      )}

      {phase === GAME_PHASE.RESULT && (
        <ResultPanel
          rankings={rankings}
          myProfile={myProfile}
          totalQuestions={questions.length}
          onShowReview={handleShowReview}
          onReturnToRoom={handleReturnToRoom}
          onExit={handleExit}
        />
      )}

      {phase === GAME_PHASE.REVIEW && (
        <ReviewPanel
          questions={answeredQuestions}
          onBack={handleBackToResult}
        />
      )}

      {showCoinReward && (
        <CoinRewardNotification
          coins={50}
          onClose={() => setShowCoinReward(false)}
        />
      )}
    </MiniGameLayout>
  );
}

/**
 * 👇 다른 사용자 소리 재생용 컴포넌트
 */
const UserAudioComponent = ({ streamManager }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (streamManager && audioRef.current) {
      streamManager.addVideoElement(audioRef.current);
    }
  }, [streamManager]);

  return <audio autoPlay ref={audioRef} />;
};
