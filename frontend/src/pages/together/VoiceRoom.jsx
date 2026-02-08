import React, { useEffect, useState, useRef } from 'react';
import { OpenVidu } from 'openvidu-browser';
import { createSession, createToken } from '@/api/openVidu'; // ?„ê¹Œ ë§Œë“  API ?Œì¼ ê²½ë¡œ ?•ì¸!

const VoiceRoom = () => {
  // ?íƒœ ê´€ë¦?
  const [session, setSession] = useState(undefined); // OpenVidu ?¸ì…˜ ê°ì²´
  const [publisher, setPublisher] = useState(undefined); // ???¤ë””??(ë§í•˜???¬ëŒ)
  const [subscribers, setSubscribers] = useState([]); // ?¤ë¥¸ ?¬ëŒ??(?£ëŠ” ?¬ëŒ)
  const [currentSessionId, setCurrentSessionId] = useState("room-1"); // ë°??´ë¦„ (?¼ë‹¨ ê³ ì •)

  // OpenVidu ê°ì²´???Œë”ë§ê³¼ ?ê??†ì´ ? ì??˜ì–´???˜ë?ë¡?useRef ?¬ìš© (? íƒ?¬í•­?´ë‚˜ ê¶Œì¥)
  const OV = useRef(null);

  /**
   * 1. ë°??…ì¥?˜ê¸° (Join Session)
   */
  const joinSession = async () => {
    // 1) OpenVidu ê°ì²´ ?ì„±
    OV.current = new OpenVidu();

    // 2) ?¸ì…˜(ë°? ì´ˆê¸°??
    const newSession = OV.current.initSession();

    // 3) ?´ë²¤??ë¦¬ìŠ¤???¤ì • (ì¤‘ìš”!)
    // ?„êµ°ê°€ ë°©ì— ?¤ì–´?¤ë©´(?ˆë¡œ???¤íŠ¸ë¦¼ì´ ?ê¸°ë©?
    newSession.on('streamCreated', (event) => {
      // ê·??¬ëŒ???Œë¦¬ë¥??£ê¸° ?„í•´ êµ¬ë…(Subscribe)
      const subscriber = newSession.subscribe(event.stream, undefined);
      // ??êµ¬ë…??ëª©ë¡??ì¶”ê?
      setSubscribers((prev) => [...prev, subscriber]);
    });

    // ?„êµ°ê°€ ?˜ê?ë©?
    newSession.on('streamDestroyed', (event) => {
      // ??êµ¬ë…??ëª©ë¡?ì„œ ?œê±°
      setSubscribers((prev) => prev.filter((sub) => sub !== event.stream.streamManager));
    });

    // ?ˆì™¸ ë°œìƒ ??ë¡œê·¸ ì¶œë ¥
    newSession.on('exception', (exception) => {
      console.warn(exception);
    });

    setSession(newSession);

    try {
      // 4) ë°±ì—”?œì—??? í° ë°›ì•„?¤ê¸° (?°ë¦¬ê°€ ë§Œë“  API ?¬ìš©)
      // ë°©ì´ ?†ìœ¼ë©?ë§Œë“¤ê³? ?ˆìœ¼ë©?? í°ë§?ë°›ì•„?µë‹ˆ??
      // (?œì„œ: createSession -> createToken)
      
      // ì£¼ì˜: ?´ë? ë°©ì´ ì¡´ì¬?????ˆìœ¼ë¯€ë¡? ë°??ì„± ?œë„ ???ëŸ¬?˜ë©´ ë°”ë¡œ ? í° ë°œê¸‰?¼ë¡œ ?˜ì–´ê°€??ë¡œì§???„ìš”?????ˆìŠµ?ˆë‹¤.
      // ?˜ì?ë§?OpenVidu ?¹ì„±??"?†ëŠ” ë°?IDë¡?? í° ?¬ë¼ê³??˜ë©´" ?ëŸ¬ê°€ ?˜ë?ë¡?
      // ?ˆì „?˜ê²Œ ??ƒ createSession??ë¨¼ì? ?¸ì¶œ?˜ëŠ” ê²?ì¢‹ìŠµ?ˆë‹¤. (?´ë? ?ˆìœ¼ë©?ë°±ì—”?œê? ?Œì•„??ì²˜ë¦¬?˜ê±°??ë¬´ì‹œ??
      await createSession(currentSessionId); 
      const token = await createToken(currentSessionId);

      // 5) ? í°?¼ë¡œ ?¤ì œ ?‘ì†
      // clientData???‰ë„¤?„ì„ ?£ì–´???¤ë¥¸ ?¬ëŒ?ê²Œ ë³´ì—¬ì¤????ˆìŠµ?ˆë‹¤.
      await newSession.connect(token, { clientData: "???‰ë„¤?? });

      // 6) ??ë§ˆì´??ì¼œê¸° (Publisher ?¤ì •)
      // ??ì¤‘ìš”: videoSource: falseë¡??¤ì •?´ì„œ '?Œì„± ?„ìš©'?¼ë¡œ ë§Œë“­?ˆë‹¤.
      const newPublisher = await OV.current.initPublisherAsync(undefined, {
        audioSource: true,  // ë§ˆì´???¬ìš©
        videoSource: false, // ì¹´ë©”?¼ëŠ” ??(?Œì„± ì±„íŒ…ë°?
        publishAudio: true, // ?¤ë””???¡ì¶œ ?œì‘
        publishVideo: false,// ë¹„ë””???¡ì¶œ ????
        resolution: '640x480',
        frameRate: 30,
        insertMode: 'APPEND',
        mirror: false,
      });

      // 7) ?¸ì…˜?????¤ë””???¡ì¶œ
      newSession.publish(newPublisher);
      setPublisher(newPublisher);

    } catch (error) {
      console.error('?‘ì† ?¤íŒ¨:', error);
      alert("ë°??…ì¥???¤íŒ¨?ˆìŠµ?ˆë‹¤: " + error.message);
    }
  };

  /**
   * 2. ë°??˜ê?ê¸?(Leave Session)
   */
  const leaveSession = () => {
    if (session) {
      session.disconnect();
    }

    // ?íƒœ ì´ˆê¸°??
    OV.current = null;
    setSession(undefined);
    setSubscribers([]);
    setPublisher(undefined);
  };

  // ì»´í¬?ŒíŠ¸ê°€ ?¬ë¼ì§????¸ë§ˆ?´íŠ¸) ?ë™?¼ë¡œ ë°??˜ê?ê¸?
  useEffect(() => {
    return () => {
        if(session) session.disconnect();
    };
  }, [session]);


  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>?¤ ?Œì„± ?˜ë‹¤ë°?(ìµœë? 4ëª?</h1>

      {/* ?‘ì†?˜ì? ?Šì•˜????*/}
      {!session ? (
        <div id="join">
          <p>ë°??´ë¦„: {currentSessionId}</p>
          <button onClick={joinSession} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
            ?…ì¥?˜ê¸°
          </button>
        </div>
      ) : (
        /* ?‘ì†?ˆì„ ??*/
        <div id="session">
          <div id="session-header">
            <h2>ë°? {currentSessionId}</h2>
            <button onClick={leaveSession} style={{ background: 'red', color: 'white', border: 'none', padding: '10px', cursor: 'pointer' }}>
              ?˜ê?ê¸?
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
            
            {/* ??ë§ˆì´???íƒœ (Publisher) */}
            {publisher && (
              <div className="stream-container" style={{ border: '2px solid blue', padding: '10px', borderRadius: '10px' }}>
                <h3>??(Me)</h3>
                <p>?”Š ë§ˆì´??ì¼œì§</p>
                {/* ?¤ë””???œê·¸???„ìš” ?†ì?ë§???ëª©ì†Œë¦¬ëŠ” ?´ê? ???¤ìŒ), ?¤íŠ¸ë¦?ê´€ë¦¬ë? ?„í•´ ì¡´ì¬????*/}
              </div>
            )}

            {/* ?¤ë¥¸ ?¬ëŒ???íƒœ (Subscribers) */}
            {subscribers.map((sub, i) => (
              <div key={i} className="stream-container" style={{ border: '2px solid green', padding: '10px', borderRadius: '10px' }}>
                <h3>ì°¸ê???{i + 1}</h3>
                {/* ??ì¤‘ìš”: ?ë?ë°©ì˜ ?Œë¦¬ë¥??¬ìƒ?˜ëŠ” Audio ì»´í¬?ŒíŠ¸ */}
                <AudioStream streamManager={sub} />
                <p>?°ì´?? {sub.stream.connection.data}</p> 
                {/* ë°±ì—”?œì—??ë³´ë‚¸ username???€ data ?ˆì— ?¤ì–´?ˆìŠµ?ˆë‹¤ (?•ì‹???°ë¼ ?Œì‹± ?„ìš”?????ˆìŒ) */}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ???Œë¦¬ë¥??¬ìƒ?´ì£¼???‘ì? ì»´í¬?ŒíŠ¸
const AudioStream = ({ streamManager }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (streamManager && audioRef.current) {
      streamManager.addVideoElement(audioRef.current); // ?¤ë””???”ì†Œ???¤íŠ¸ë¦??°ê²°
    }
  }, [streamManager]);

  return <audio autoPlay ref={audioRef} controls={false} />;
};

export default VoiceRoom;
