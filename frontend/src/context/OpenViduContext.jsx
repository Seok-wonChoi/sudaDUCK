import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { OpenVidu } from 'openvidu-browser';

const OpenViduContext = createContext();

export const useOpenVidu = () => useContext(OpenViduContext);

export const OpenViduProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [publisher, setPublisher] = useState(null);
    const [subscribers, setSubscribers] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    // 1. ?∏ÏÖò Ï∞∏Í? (?†ÌÅ∞ -> ?∞Í≤∞)
    const joinSession = useCallback(async (token, nickname) => {
        if (!token) return;
        
        // ?ëá ?¥Î? ?∏ÏÖò???àÏúºÎ©?Ï§ëÎ≥µ ?∞Í≤∞??Î∞©Ï??©Îãà??
        if (session) {
            // console.log("?îí [OpenVidu] ?¥Î? ?∏ÏÖò???∞Í≤∞?òÏñ¥ ?àÏäµ?àÎã§.");
            return;
        }

        let newSession = null;
        let newPublisher = null;

        try {
            const OV = new OpenVidu();
            newSession = OV.initSession();

            // ?§Ìä∏Î¶?Î¶¨Ïä§??(?ÅÎ?Î∞??§Ïñ¥?§Î©¥ ?åÎ¶¨/?îÎ©¥ Î∞õÍ∏∞)
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

            // ???∞Í≤∞ ?§Ìñâ ??
            await newSession.connect(token, { clientData: nickname });

            // ??ÎßàÏù¥???§Ï†ï (?§Îîî?§Îßå ON)
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
            // console.log("?é§ ?§ÌîàÎπÑÎëê ?∞Í≤∞ ?±Í≥µ!");

        } catch (error) {
            console.error("???∞Í≤∞ ?§Ìå®:", error);

            // ?êÎü¨ Î∞úÏÉù ???ïÎ¶¨
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

            // ?ÅÌÉú Ï¥àÍ∏∞??
            setSession(null);
            setPublisher(null);
            setSubscribers([]);
            setIsConnected(false);

            throw error; // ?êÎü¨Î•??§Ïãú ?òÏ†∏???∏Ï∂ú?êÍ? Ï≤òÎ¶¨?????àÍ≤å ??
        }
    }, [session]); // ?ëà session ?ÅÌÉú Í∞êÏãú

    // 2. ?òÍ?Í∏?(?∞Í≤∞ ?äÍ∏∞)
    const leaveSession = useCallback(() => {
        try {
            // Publisher ?ïÎ¶¨
            if (publisher) {
                try {
                    publisher.stream?.disposeWebRtcPeer();
                } catch (e) {
                    console.warn('[OpenVidu] Publisher cleanup error:', e);
                }
            }

            // Subscribers ?ïÎ¶¨
            subscribers.forEach(subscriber => {
                try {
                    subscriber.stream?.disposeWebRtcPeer();
                } catch (e) {
                    console.warn('[OpenVidu] Subscriber cleanup error:', e);
                }
            });

            // ?∏ÏÖò ?∞Í≤∞ ?¥Ï†ú
            if (session) {
                try {
                    session.disconnect();
                } catch (e) {
                    console.warn('[OpenVidu] Session disconnect error:', e);
                }
            }

            // console.log('?îå [OpenVidu] ?∞Í≤∞ ?¥Ï†ú ?ÑÎ£å');
        } catch (error) {
            console.error('[OpenVidu] Leave session error:', error);
        } finally {
            // ?ÅÌÉú Ï¥àÍ∏∞??
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
