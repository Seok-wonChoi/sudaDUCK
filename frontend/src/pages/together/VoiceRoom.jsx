import React, { useEffect, useState, useRef } from 'react';
import { OpenVidu } from 'openvidu-browser';
import { createSession, createToken } from '@/api/openVidu'; // 아까 만든 API 파일 경로 확인!

const VoiceRoom = () => {
  // 상태 관리
  const [session, setSession] = useState(undefined); // OpenVidu 세션 객체
  const [publisher, setPublisher] = useState(undefined); // 내 오디오 (말하는 사람)
  const [subscribers, setSubscribers] = useState([]); // 다른 사람들 (듣는 사람)
  const [currentSessionId, setCurrentSessionId] = useState("room-1"); // 방 이름 (일단 고정)

  // OpenVidu 객체는 렌더링과 상관없이 유지되어야 하므로 useRef 사용 (선택사항이나 권장)
  const OV = useRef(null);

  /**
   * 1. 방 입장하기 (Join Session)
   */
  const joinSession = async () => {
    // 1) OpenVidu 객체 생성
    OV.current = new OpenVidu();

    // 2) 세션(방) 초기화
    const newSession = OV.current.initSession();

    // 3) 이벤트 리스너 설정 (중요!)
    // 누군가 방에 들어오면(새로운 스트림이 생기면)
    newSession.on('streamCreated', (event) => {
      // 그 사람의 소리를 듣기 위해 구독(Subscribe)
      const subscriber = newSession.subscribe(event.stream, undefined);
      // 내 구독자 목록에 추가
      setSubscribers((prev) => [...prev, subscriber]);
    });

    // 누군가 나가면
    newSession.on('streamDestroyed', (event) => {
      // 내 구독자 목록에서 제거
      setSubscribers((prev) => prev.filter((sub) => sub !== event.stream.streamManager));
    });

    // 예외 발생 시 로그 출력
    newSession.on('exception', (exception) => {
      console.warn(exception);
    });

    setSession(newSession);

    try {
      // 4) 백엔드에서 토큰 받아오기 (우리가 만든 API 사용)
      // 방이 없으면 만들고, 있으면 토큰만 받아옵니다.
      // (순서: createSession -> createToken)
      
      // 주의: 이미 방이 존재할 수 있으므로, 방 생성 시도 후 에러나면 바로 토큰 발급으로 넘어가는 로직이 필요할 수 있습니다.
      // 하지만 OpenVidu 특성상 "없는 방 ID로 토큰 달라고 하면" 에러가 나므로,
      // 안전하게 항상 createSession을 먼저 호출하는 게 좋습니다. (이미 있으면 백엔드가 알아서 처리하거나 무시함)
      await createSession(currentSessionId); 
      const token = await createToken(currentSessionId);

      // 5) 토큰으로 실제 접속
      // clientData에 닉네임을 넣어서 다른 사람에게 보여줄 수 있습니다.
      await newSession.connect(token, { clientData: "내 닉네임" });

      // 6) 내 마이크 켜기 (Publisher 설정)
      // ★ 중요: videoSource: false로 설정해서 '음성 전용'으로 만듭니다.
      const newPublisher = await OV.current.initPublisherAsync(undefined, {
        audioSource: true,  // 마이크 사용
        videoSource: false, // 카메라는 끔 (음성 채팅방)
        publishAudio: true, // 오디오 송출 시작
        publishVideo: false,// 비디오 송출 안 함
        resolution: '640x480',
        frameRate: 30,
        insertMode: 'APPEND',
        mirror: false,
      });

      // 7) 세션에 내 오디오 송출
      newSession.publish(newPublisher);
      setPublisher(newPublisher);

    } catch (error) {
      console.error('접속 실패:', error);
      alert("방 입장에 실패했습니다: " + error.message);
    }
  };

  /**
   * 2. 방 나가기 (Leave Session)
   */
  const leaveSession = () => {
    if (session) {
      session.disconnect();
    }

    // 상태 초기화
    OV.current = null;
    setSession(undefined);
    setSubscribers([]);
    setPublisher(undefined);
  };

  // 컴포넌트가 사라질 때(언마운트) 자동으로 방 나가기
  useEffect(() => {
    return () => {
        if(session) session.disconnect();
    };
  }, [session]);


  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🎤 음성 수다방 (최대 4명)</h1>

      {/* 접속하지 않았을 때 */}
      {!session ? (
        <div id="join">
          <p>방 이름: {currentSessionId}</p>
          <button onClick={joinSession} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
            입장하기
          </button>
        </div>
      ) : (
        /* 접속했을 때 */
        <div id="session">
          <div id="session-header">
            <h2>방: {currentSessionId}</h2>
            <button onClick={leaveSession} style={{ background: 'red', color: 'white', border: 'none', padding: '10px', cursor: 'pointer' }}>
              나가기
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
            
            {/* 내 마이크 상태 (Publisher) */}
            {publisher && (
              <div className="stream-container" style={{ border: '2px solid blue', padding: '10px', borderRadius: '10px' }}>
                <h3>나 (Me)</h3>
                <p>🔊 마이크 켜짐</p>
                {/* 오디오 태그는 필요 없지만(내 목소리는 내가 안 들음), 스트림 관리를 위해 존재는 함 */}
              </div>
            )}

            {/* 다른 사람들 상태 (Subscribers) */}
            {subscribers.map((sub, i) => (
              <div key={i} className="stream-container" style={{ border: '2px solid green', padding: '10px', borderRadius: '10px' }}>
                <h3>참가자 {i + 1}</h3>
                {/* ★ 중요: 상대방의 소리를 재생하는 Audio 컴포넌트 */}
                <AudioStream streamManager={sub} />
                <p>데이터: {sub.stream.connection.data}</p> 
                {/* 백엔드에서 보낸 username이 저 data 안에 들어있습니다 (형식에 따라 파싱 필요할 수 있음) */}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ★ 소리를 재생해주는 작은 컴포넌트
const AudioStream = ({ streamManager }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (streamManager && audioRef.current) {
      streamManager.addVideoElement(audioRef.current); // 오디오 요소에 스트림 연결
    }
  }, [streamManager]);

  return <audio autoPlay ref={audioRef} controls={false} />;
};

export default VoiceRoom;