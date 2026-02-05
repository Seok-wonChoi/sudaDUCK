import { useState, useEffect, useCallback } from 'react';
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
import { leaveRoom, getRoomLobby } from '@/api/rooms';
import useMicAnalyzer from '@/hooks/useMicAnalyzer';
import useRoomWebSocket from '@/hooks/useRoomWebSocket';

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
  
  // Location state에서 초기값 가져오기
  const roomId = location.state?.roomId;
  const roomCode = location.state?.roomCode;
  const isHost = location.state?.isHost || false;
  const initialParticipantsCount = location.state?.participantsCount || 1;
  
  const [phase, setPhase] = useState(GAME_PHASE.COUNTDOWN);
  const [countdown, setCountdown] = useState(3);
  const [timer, setTimer] = useState(15);
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
  const [waitingForQuestions, setWaitingForQuestions] = useState(!isHost); // 방장 아니면 대기

  // 마이크 분석기 - 음성 레벨 감지
  const { isSpeaking, voiceLevel, start: startMic, stop: stopMic } = useMicAnalyzer({
    threshold: 0.03,
    holdMs: 220,
  });

  // 마이크 시작 (게임 시작 시)
  useEffect(() => {
    if (phase === GAME_PHASE.PLAYING) {
      startMic();
    }
    return () => stopMic();
  }, [phase, startMic, stopMic]);

  // 음성 레벨 맵 (throttle 적용 - 200ms)
  const [voiceLevelsMap, setVoiceLevelsMap] = useState({});
  const [lastVoiceUpdate, setLastVoiceUpdate] = useState(0);

  useEffect(() => {
    if (!isSpeaking || voiceLevel < 0.05) return;

    const now = Date.now();
    if (now - lastVoiceUpdate < 200) return;

    const myId = 'me';
    setVoiceLevelsMap((prev) => ({
      ...prev,
      [myId]: voiceLevel,
    }));
    setLastVoiceUpdate(now);

    const timeout = setTimeout(() => {
      setVoiceLevelsMap((prev) => ({
        ...prev,
        [myId]: 0,
      }));
    }, 500);

    return () => clearTimeout(timeout);
  }, [isSpeaking, voiceLevel, lastVoiceUpdate]);

  // 방 참가자 정보 초기 로드
  useEffect(() => {
    const loadRoomParticipants = async () => {
      if (!roomCode) return;
      
      try {
        const lobbyData = await getRoomLobby(roomCode);
        console.log('📊 방 참가자 정보 로드:', lobbyData);
        
        if (lobbyData && lobbyData.members && Array.isArray(lobbyData.members)) {
          const participantsList = lobbyData.members.map(member => ({
            id: member.userId || member.memberId,
            userId: member.userId || member.memberId,
            name: member.nickname,
            nickname: member.nickname,
            profileImageUrl: member.profileImageUrl,
            avatar: member.profileImageUrl,
            isActive: true,
            isMe: member.isMe || false,
            voiceLevel: 0,
          }));
          
          console.log('✅ 참가자 목록 설정:', participantsList);
          setParticipants(participantsList);
          setTotalParticipants(participantsList.length);
        }
      } catch (error) {
        console.error('❌ 방 참가자 정보 로드 실패:', error);
      }
    };

    loadRoomParticipants();
  }, [roomCode]);

  // 대기 중 제출 상태 확인 (3초마다)
  useEffect(() => {
    if (phase !== GAME_PHASE.WAITING) return;

    const checkSubmissionStatus = async () => {
      try {
        const rankingData = await getReviewRanking(roomId);
        
        console.log('📊 대기 상태 확인:', {
          rankingData: rankingData.length,
          totalParticipants,
          제출여부: rankingData.map(r => ({ 이름: r.nickname, 점수: r.score, 제출: r.hasSubmitted }))
        });
        
        if (rankingData && Array.isArray(rankingData)) {
          // ✅ 제출한 사람 수 계산 (hasSubmitted가 true인 사람만)
          const submittedUsers = rankingData.filter(r => r.hasSubmitted === true);
          setSubmittedCount(submittedUsers.length);
          
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
          
          // ✅ 모든 참가자가 제출했으면 결과 화면으로
          if (submittedUsers.length >= totalParticipants && totalParticipants > 0) {
            console.log('✅ 모든 참가자 제출 완료 - 결과 화면으로 이동');
            setRankings(rankingData);
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
  }, [phase, roomId, totalParticipants]);

  // WebSocket: 문제 데이터 수신 핸들러
  const handleQuestionsReady = useCallback((payload) => {
    console.log('📥 문제 데이터 수신:', payload);
    
    if (!payload || !payload.questions) {
      console.error('❌ 문제 데이터 없음');
      return;
    }
    
    // 받은 문제 데이터 처리
    const receivedQuestions = payload.questions;
    
    // 유효성 검증 및 포맷팅
    const formattedQuestions = receivedQuestions
      .filter(item => {
        if (!item.blank_script || !item.korean || !item.english) return false;
        const hasBlanks = item.blank_script.includes('[') && item.blank_script.includes(']');
        return hasBlanks;
      })
      .map(item => {
        const { parts, answers } = parseBlankScript(item.blank_script);
        
        if (answers.length === 0) return null;
        
        return {
          scriptId: item.scriptId,
          korean: item.korean,
          english: item.english,
          englishParts: parts,
          blanks: answers.map((ans) => ({ answer: ans.trim() })),
        };
      })
      .filter(Boolean);
    
    console.log('✅ 포맷팅된 문제:', formattedQuestions);
    
    setQuestions(formattedQuestions);
    initQuestion(0, formattedQuestions);
    setWaitingForQuestions(false);
    setIsLoading(false);
    
  }, []);

  // WebSocket 연결
  useRoomWebSocket(
    roomCode,
    {
      onMiniGameQuestionsReady: handleQuestionsReady,
    },
    roomId
  );

  // 문제 가져오기 (방장만 실행)
  useEffect(() => {
    const fetchData = async () => {
      if (!roomId) {
        console.error('roomId가 없습니다');
        navigate('/together');
        return;
      }

      if (!isHost) {
        console.log('🔄 방장 아님 - 문제 대기 중...');
        return; // 방장 아니면 실행 안 함
      }

      try {
        setIsLoading(true);
        console.log('👑 [방장] 문제 요청 시작');

        const questionsData = await getReviewQuestions(roomId);
        
        console.log('📊 [방장] 받아온 문제:', questionsData);

        // 유효한 문제 필터링
        const validQuestions = questionsData.filter(
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

        console.log('📊 [방장] 유효한 문제:', validQuestions.length);

        if (validQuestions.length === 0) {
          console.error('유효한 문제가 없습니다');
          alert('문제를 불러올 수 없습니다.');
          navigate('/together');
          return;
        }

        // WebSocket으로 모든 참가자에게 브로드캐스트
        const stompClient = window.stompClient;
        if (stompClient && stompClient.connected) {
          console.log('📤 [방장] 문제 브로드캐스트');
          
          stompClient.publish({
            destination: `/app/rooms/${roomCode}/minigame/questions`,
            body: JSON.stringify({
              questions: validQuestions
            })
          });
        } else {
          console.error('❌ WebSocket 연결 안 됨');
        }

        // 방장도 문제 표시
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

        console.log('✅ [방장] 최종 문제:', formattedQuestions);

        setQuestions(formattedQuestions);
        initQuestion(0, formattedQuestions);
        setIsLoading(false);
        
      } catch (error) {
        console.error('❌ [방장] 문제 가져오기 실패:', error);
        setIsLoading(false);
        alert('문제를 불러올 수 없습니다.');
        navigate('/together');
      }
    };

    fetchData();
  }, [roomId, isHost, roomCode, navigate]);

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
    // ✅ 수정: 현재 문제 + 나머지 안 푼 문제 모두 추가
    const finalAnswers = [...answeredQuestions];
    
    // 현재 문제부터 끝까지 모든 문제를 빈 답변으로 추가
    for (let i = currentQuestion; i < questions.length; i++) {
      const q = questions[i];
      
      // 현재 문제라면 입력한 답변 사용, 아니면 빈 답변
      const isCurrentQuestion = i === currentQuestion;
      
      const answered = {
        scriptId: q.scriptId,
        koreanSentence: q.korean,
        englishSentence: q.english,
        englishParts: q.englishParts,
        blanks: q.blanks.map((b, idx) => {
          const userAns = isCurrentQuestion ? (blanksState[idx]?.value || '') : '';
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

    console.log('⏰ 시간 종료 - 모든 문제 제출:', finalAnswers);

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

  if (isLoading || waitingForQuestions) {
    return (
      <MiniGameLayout>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          {isHost ? (
            <>
              <div>문제를 불러오는 중...</div>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                모든 참가자에게 문제를 전송합니다
              </div>
            </>
          ) : (
            <>
              <div>방장이 문제를 준비하는 중...</div>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                잠시만 기다려주세요
              </div>
            </>
          )}
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
      totalProgress={15}
      isReviewMode={phase === GAME_PHASE.REVIEW}
      onComplete={phase === GAME_PHASE.REVIEW ? handleBackToResult : null}
    >
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
