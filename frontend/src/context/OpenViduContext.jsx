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

        let newSession = null;
        let newPublisher = null;

        try {
            const OV = new OpenVidu();
            newSession = OV.initSession();

            // 스트림 리스너 (상대방 들어오면 소리/화면 받기)
            newSession.on('streamCreated', (event) => {
                const subscriber = newSession.subscribe(event.stream, undefined);
                setSubscribers((prev) => [...prev, subscriber]);
            });

            newSession.on('streamDestroyed', (event) => {
                setSubscribers((prev) => prev.filter((sub) => sub !== event.stream.streamManager));
            });

            newSession.on('exception', (exception) => {
                console.warn('[OpenVidu] Exception:', exception);
            });

            // ★ 연결 실행 ★
            await newSession.connect(token, { clientData: nickname });

            // 내 마이크 설정 (오디오만 ON)
            newPublisher = await OV.initPublisherAsync(undefined, {
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

            // 에러 발생 시 정리
            if (newPublisher) {
                try {
                    newPublisher.stream.disposeWebRtcPeer();
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
            if (newSession) {
                try {
                    newSession.disconnect();
                } catch (e) {
                    // Ignore cleanup errors
                }
            }

            // 상태 초기화
            setSession(null);
            setPublisher(null);
            setSubscribers([]);
            setIsConnected(false);

            throw error; // 에러를 다시 던져서 호출자가 처리할 수 있게 함
        }
    }, [session]); // 👈 session 상태 감시

    // 2. 나가기 (연결 끊기)
    const leaveSession = useCallback(() => {
        try {
            // Publisher 정리
            if (publisher) {
                try {
                    publisher.stream?.disposeWebRtcPeer();
                } catch (e) {
                    console.warn('[OpenVidu] Publisher cleanup error:', e);
                }
            }

            // Subscribers 정리
            subscribers.forEach(subscriber => {
                try {
                    subscriber.stream?.disposeWebRtcPeer();
                } catch (e) {
                    console.warn('[OpenVidu] Subscriber cleanup error:', e);
                }
            });

            // 세션 연결 해제
            if (session) {
                try {
                    session.disconnect();
                } catch (e) {
                    console.warn('[OpenVidu] Session disconnect error:', e);
                }
            }

            console.log('🔌 [OpenVidu] 연결 해제 완료');
        } catch (error) {
            console.error('[OpenVidu] Leave session error:', error);
        } finally {
            // 상태 초기화
            setSession(null);
            setPublisher(null);
            setSubscribers([]);
            setIsConnected(false);
        }
    }, [session, publisher, subscribers]);

    return (
        <OpenViduContext.Provider value={{ session, publisher, subscribers, isConnected, joinSession, leaveSession }}>
            {children}
        </OpenViduContext.Provider>
    );
};