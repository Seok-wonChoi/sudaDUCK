import React, { useEffect, useState, useRef } from 'react';
import { OpenVidu } from 'openvidu-browser';
import { createSession, createToken } from '@/api/openVidu'; // 아까 만든 API 파일 경로 확인!

const VoiceRoom = () => {
  const [session, setSession] = useState(undefined);
  const [publisher, setPublisher] = useState(undefined);
  const [subscribers, setSubscribers] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState("room-1");

  // ★ 추가된 상태: 말하고 있는 사람들의 ID를 저장하는 집합(Set)
  const [speakingUsers, setSpeakingUsers] = useState(new Set());

  const OV = useRef(null);

  const joinSession = async () => {
    OV.current = new OpenVidu();
    
    // ★ 오디오 감지 민감도 설정 (선택사항)
    // publisherSpeakingEventsOptions: { interval: 100, threshold: -50 } 
    // (기본값으로도 잘 동작하므로 일단 넘어갑니다)

    const newSession = OV.current.initSession();

    // --- 기존 이벤트 리스너 ---
    newSession.on('streamCreated', (event) => {
      const subscriber = newSession.subscribe(event.stream, undefined);
      setSubscribers((prev) => [...prev, subscriber]);
    });

    newSession.on('streamDestroyed', (event) => {
      setSubscribers((prev) => prev.filter((sub) => sub !== event.stream.streamManager));
    });

    newSession.on('exception', (exception) => {
      console.warn(exception);
    });

    // 🔥 [핵심 기능] 말하기 시작 이벤트 리스너 🔥
    newSession.on('publisherStartSpeaking', (event) => {
      console.log('말하는 중:', event.connection.connectionId);
      setSpeakingUsers((prev) => new Set(prev).add(event.connection.connectionId));
    });

    // 🔥 [핵심 기능] 말하기 멈춤 이벤트 리스너 🔥
    newSession.on('publisherStopSpeaking', (event) => {
      console.log('말하기 멈춤:', event.connection.connectionId);
      setSpeakingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(event.connection.connectionId);
        return newSet;
      });
    });

    setSession(newSession);

    try {
      await createSession(currentSessionId); 
      const token = await createToken(currentSessionId);
      await newSession.connect(token, { clientData: "내 닉네임" });

      const newPublisher = await OV.current.initPublisherAsync(undefined, {
        audioSource: true,
        videoSource: false,
        publishAudio: true,
        publishVideo: false,
        resolution: '640x480',
        frameRate: 30,
        insertMode: 'APPEND',
        mirror: false,
      });

      newSession.publish(newPublisher);
      setPublisher(newPublisher);

    } catch (error) {
      console.error('접속 실패:', error);
    }
  };

  const leaveSession = () => {
    if (session) {
      session.disconnect();
    }
    OV.current = null;
    setSession(undefined);
    setSubscribers([]);
    setPublisher(undefined);
    setSpeakingUsers(new Set()); // 상태 초기화
  };

  useEffect(() => {
    return () => {
        if(session) session.disconnect();
    };
  }, [session]);

  // ★ 헬퍼 함수: 해당 스트림이 말하고 있는지 확인
  const isSpeaking = (connectionId) => {
    return speakingUsers.has(connectionId);
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🎤 음성 수다방</h1>

      {!session ? (
        <div id="join">
          <button onClick={joinSession} style={{ padding: '10px 20px', fontSize: '16px' }}>입장하기</button>
        </div>
      ) : (
        <div id="session">
          <div id="session-header">
            <h2>방: {currentSessionId}</h2>
            <button onClick={leaveSession} style={{ background: 'red', color: 'white', border: 'none', padding: '10px' }}>나가기</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px', flexWrap: 'wrap' }}>
            
            {/* 내 마이크 상태 (Publisher) */}
            {publisher && (
              <div 
                className={`stream-container ${isSpeaking(publisher.stream.connection.connectionId) ? 'speaking-border' : ''}`}
              >
                <h3>나 (Me)</h3>
                <p>{isSpeaking(publisher.stream.connection.connectionId) ? "🗣️ 말하는 중..." : "🤫 조용함"}</p>
              </div>
            )}

            {/* 다른 사람들 상태 (Subscribers) */}
            {subscribers.map((sub, i) => (
              <div 
                key={i} 
                className={`stream-container ${isSpeaking(sub.stream.connection.connectionId) ? 'speaking-border' : ''}`}
              >
                <h3>참가자 {i + 1}</h3>
                <AudioStream streamManager={sub} />
                <p>데이터: {JSON.parse(sub.stream.connection.data).clientData || "Guest"}</p>
                <p>{isSpeaking(sub.stream.connection.connectionId) ? "🗣️ 말하는 중..." : "🤫 조용함"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AudioStream = ({ streamManager }) => {
  const audioRef = useRef(null);
  useEffect(() => {
    if (streamManager && audioRef.current) {
      streamManager.addVideoElement(audioRef.current);
    }
  }, [streamManager]);
  return <audio autoPlay ref={audioRef} controls={false} />;
};

export default VoiceRoom;