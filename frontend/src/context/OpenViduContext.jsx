import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { OpenVidu } from 'openvidu-browser';

const OpenViduContext = createContext();

export const useOpenVidu = () => useContext(OpenViduContext);

export const OpenViduProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [publisher, setPublisher] = useState(null);
    const [subscribers, setSubscribers] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    // 1. 세션 참가 (토큰 -> 연결)
    const joinSession = useCallback(async (token, nickname) => {
        if (!token) return;
        
        // 👇 이미 세션이 있으면 중복 연결을 방지합니다.
        if (session) {
            console.log("🔒 [OpenVidu] 이미 세션에 연결되어 있습니다.");
            return;
        }

        try {
            const OV = new OpenVidu();
            const newSession = OV.initSession();

            // 스트림 리스너 (상대방 들어오면 소리/화면 받기)
            newSession.on('streamCreated', (event) => {
                const subscriber = newSession.subscribe(event.stream, undefined);
                setSubscribers((prev) => [...prev, subscriber]);
            });

            newSession.on('streamDestroyed', (event) => {
                setSubscribers((prev) => prev.filter((sub) => sub !== event.stream.streamManager));
            });

            // ★ 연결 실행 ★
            await newSession.connect(token, { clientData: nickname });

            // 내 마이크 설정 (오디오만 ON)
            const newPublisher = await OV.initPublisherAsync(undefined, {
                audioSource: undefined,
                videoSource: false, 
                publishAudio: true,
                publishVideo: false,
            });

            newSession.publish(newPublisher);

            setSession(newSession);
            setPublisher(newPublisher);
            setIsConnected(true);
            console.log("🎤 오픈비두 연결 성공!");

        } catch (error) {
            console.error("❌ 연결 실패:", error);
        }
    }, [session]); // 👈 session 상태 감시

    // 2. 나가기 (연결 끊기)
    const leaveSession = useCallback(() => {
        if (session) session.disconnect();
        setSession(null);
        setPublisher(null);
        setSubscribers([]);
        setIsConnected(false);
    }, [session]);

    return (
        <OpenViduContext.Provider value={{ session, publisher, subscribers, isConnected, joinSession, leaveSession }}>
            {children}
        </OpenViduContext.Provider>
    );
};