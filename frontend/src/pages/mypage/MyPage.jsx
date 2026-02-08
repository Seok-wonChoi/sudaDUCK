import { useState, useEffect } from "react";
import styles from "./MyPage.module.css";
import AppHeader from "@/components/layout/AppHeader/AppHeader";
import { getMyScripts, updateAvatarCustom, updateDuckCustom, getMyProfileCustom, purchaseItem, updateNickname, updateAiDuckBot, getCustomItems, getMypageSummary} from "@/api/mypage";
import { logout } from "@/api/auth";
import { useNavigate } from "react-router-dom";
import ProfileSection from "@/components/features/mypage/ProfileSection/ProfileSection";
import StatsCard from "@/components/features/mypage/StatsCard/StatsCard";
import SentenceList from "@/components/features/mypage/SentenceList/SentenceList";

import SentenceDetailModal from "@/components/features/mypage/modals/SentenceDetailModal/SentenceDetailModal";
import NicknameStyleModal from "@/components/features/mypage/modals/NicknameStyleModal/NicknameStyleModal";
import DuckStyleModal from "@/components/features/mypage/modals/DuckStyleModal/DuckStyleModal";
import DuckBotModal from "@/components/features/mypage/modals/DuckBotModal/DuckBotModal";
import ConfirmModal from "@/components/common/ConfirmModal/ConfirmModal"; // ?ëà ConfirmModal Ï∂îÍ?

import duckBotCyan from "@/assets/images/duck_bot_cyan.png";
import duckBotOrange from "@/assets/images/duck_bot_orange.png";
import duckBotDigital from "@/assets/images/duck_bot_digital.png";
import duckBotMecha from "@/assets/images/duck_bot_mecha.png";

import duckProfile1 from "@/assets/images/duck_profile1.png";
import duckProfile2 from "@/assets/images/duck_profile2.png";
import duckProfile3 from "@/assets/images/duck_profile3.png";
import duckProfile4 from "@/assets/images/duck_profile4.png";
import { toggleScriptLike } from "@/api/shadowing.js";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const DUCK_BOT_IMAGES = {
  cyan: duckBotCyan,
  orange: duckBotOrange,
  digital: duckBotDigital,
  mecha: duckBotMecha,
};

const DUCK_PROFILE_IMAGES = {
  profile1: duckProfile1,
  profile2: duckProfile2,
  profile3: duckProfile3,
  profile4: duckProfile4,
};

export default function MyPage() {
  const navigate = useNavigate();
  const [sentences, setSentences] = useState([]);
  const [selectedSentence, setSelectedSentence] = useState(null);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showDuckModal, setShowDuckModal] = useState(false);
  const [showDuckBotModal, setShowDuckBotModal] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // ?ëà ?†Ïä§??Î∞???†ú Î™®Îã¨ ?ÅÌÉú Ï∂îÍ?
  const [toastMessage, setToastMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sentenceToDelete, setSentenceToDelete] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 2500);
  };


  // localStorage?êÏÑú ?ÑÎ°ú???ïÎ≥¥ ?ΩÏñ¥?§Í∏∞ (Ï¥àÍ∏∞ ?åÎçîÎß??åÎûò??Î∞©Ï?)
  const getInitialProfile = () => {
    try {
      const savedProfile = localStorage.getItem('userProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        return {
          profileId: profile.profileId || "profile1",
          color: profile.color || "white",
          accessory: profile.accessory || "none",
        };
      }
    } catch (e) {
      console.error("localStorage ?ÑÎ°ú???ΩÍ∏∞ ?§Ìå®:", e);
    }
    return { profileId: "profile1", color: "white", accessory: "none" };
  };

  const initialProfile = getInitialProfile();

  // localStorage?êÏÑú ?âÎÑ§???ΩÏñ¥?§Í∏∞ (Ï¥àÍ∏∞ ?åÎçîÎß??åÎûò??Î∞©Ï?)
  const getInitialNickname = () => {
    try {
      const savedNickname = localStorage.getItem('userNickname');
      return savedNickname || "?ÅÏñ¥ ÎßàÏä§??;
    } catch (e) {
      console.error("localStorage ?âÎÑ§???ΩÍ∏∞ ?§Ìå®:", e);
      return "?ÅÏñ¥ ÎßàÏä§??;
    }
  };

  const [nickname, setNickname] = useState(getInitialNickname());
  const [nicknameStyle, setNicknameStyle] = useState({
    background: "gradient",
    effect: "none",
  });
  const [duckProfileId, setDuckProfileId] = useState(initialProfile.profileId);
  const [duckStyle, setDuckStyle] = useState({
    color: initialProfile.color,
    accessory: initialProfile.accessory,
  });
  const [duckBotId, setDuckBotId] = useState("cyan");

  // ?µÍ≥Ñ ?∞Ïù¥??
  const [totalPlaytime, setTotalPlaytime] = useState(0); // Ï¥??åÎ†à???Ä??(Ï¥?
  const [consecutiveDays, setConsecutiveDays] = useState(null);
  const [sentenceCount, setSentenceCount] = useState(null);


  // ÏΩîÏù∏ ?úÏä§??
  const [coins, setCoins] = useState(200); // Ï¥àÍ∏∞ ÏΩîÏù∏ (?åÏä§?∏Ïö© 200ÏΩîÏù∏)
  const [unlockedProfiles, setUnlockedProfiles] = useState(["profile1"]); // Í∏∞Î≥∏ ?ÑÎ°ú??(profile1)
  const [unlockedColors, setUnlockedColors] = useState(["white"]); // Í∏∞Î≥∏ ?âÏÉÅ (?∞ÏÉâ)
  const [unlockedAccessories, setUnlockedAccessories] = useState(["none"]); // Í∏∞Î≥∏ ?ÖÏÑ∏?¨Î¶¨ ?ÜÏùå
  const [unlockedDuckBots, setUnlockedDuckBots] = useState(["cyan"]); // Í∏∞Î≥∏ ?§Î¶¨Î¥?
  const [unlockedBackgrounds, setUnlockedBackgrounds] = useState(["default"]); // Í∏∞Î≥∏ Î∞∞Í≤Ω (Í∏∞Î≥∏)
  const [unlockedEffects, setUnlockedEffects] = useState(["none"]); // Í∏∞Î≥∏ ?®Í≥º (?ÜÏùå)

  // itemKey -> itemId Îß§Ìïë (?ÑÏù¥??Íµ¨Îß§??
  const [itemKeyToIdMap, setItemKeyToIdMap] = useState({});

  // ?ÑÏù¥??Î™©Î°ù Î°úÎìú Î∞?itemKey -> itemId Îß§Ìïë ?ùÏÑ±
  useEffect(() => {
    const fetchItemsAndProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsReady(true);
        return;
      }
      try {
        // 1. Î™®Îì† Ïπ¥ÌÖåÍ≥†Î¶¨???ÑÏù¥??Î™©Î°ù Ï°∞Ìöå
        const categories = ["DUCK_STYLE", "DUCK_COLOR", "DUCK_ACCESSORY", "AVATAR_BG", "AVATAR_EFFECT", "AI_DUCKBOT_MODEL"];
        const itemsPromises = categories.map(category => getCustomItems(category));
        const itemsResults = await Promise.all(itemsPromises);

        // 2. itemKey -> itemId Îß§Ìïë ?ùÏÑ± Î∞?unlocked ?ÑÏù¥??Ï∂îÏ∂ú
        const keyToIdMap = {};
        const ownedProfiles = [];
        const ownedColors = [];
        const ownedAccessories = [];
        const ownedBackgrounds = [];
        const ownedEffects = [];
        const ownedDuckBots = [];

        itemsResults.forEach((result) => {
          if (result && result.items) {
            result.items.forEach((item) => {
              const uniqueKey = `${result.category}:${item.itemKey}`;
              // itemKey -> itemId Îß§Ìïë
              keyToIdMap[uniqueKey] = item.itemId;

              // owned ?ÑÏù¥??Î∂ÑÎ•ò
              if (item.owned) {
                switch (result.category) {
                  case "DUCK_STYLE":
                    ownedProfiles.push(item.itemKey);
                    break;
                  case "DUCK_COLOR":
                    ownedColors.push(item.itemKey);
                    break;
                  case "DUCK_ACCESSORY":
                    ownedAccessories.push(item.itemKey);
                    break;
                  case "AVATAR_BG":
                    ownedBackgrounds.push(item.itemKey);
                    break;
                  case "AVATAR_EFFECT":
                    ownedEffects.push(item.itemKey);
                    break;
                  case "AI_DUCKBOT_MODEL":
                    ownedDuckBots.push(item.itemKey);
                    break;
                }
              }
            });
          }
        });

        setItemKeyToIdMap(keyToIdMap);
        setUnlockedProfiles(ownedProfiles.length > 0 ? ownedProfiles : ["profile1"]);
        setUnlockedColors(ownedColors.length > 0 ? ownedColors : ["white"]);
        setUnlockedAccessories(ownedAccessories.length > 0 ? ownedAccessories : ["none"]);
        setUnlockedBackgrounds(ownedBackgrounds.length > 0 ? ownedBackgrounds : ["default"]);
        setUnlockedEffects(ownedEffects.length > 0 ? ownedEffects : ["none"]);
        setUnlockedDuckBots(ownedDuckBots.length > 0 ? ownedDuckBots : ["cyan"]);

        // 3. ?ÑÎ°ú???ïÎ≥¥ Ï°∞Ìöå
        const profileData = await getMyProfileCustom();

        if (profileData.nickname) {
          setNickname(profileData.nickname);
          // localStorage???âÎÑ§???Ä??(?§Î•∏ ?òÏù¥ÏßÄ?êÏÑú ?¨Ïö©)
          localStorage.setItem('userNickname', profileData.nickname);
          window.dispatchEvent(new Event('nicknameUpdated'));
        }
        if (profileData.coins !== undefined) setCoins(profileData.coins);
        if (profileData.totalTime !== undefined) setTotalPlaytime(profileData.totalTime);
        if (profileData.attendanceDays !== undefined) setConsecutiveDays(profileData.attendanceDays);

        // JSON Î¨∏Ïûê???åÏã±
        if (profileData.duckCustomJson) {
          try {
            const duckCustom = JSON.parse(profileData.duckCustomJson);
            if (duckCustom.style) setDuckProfileId(duckCustom.style);
            setDuckStyle({
              color: duckCustom.color || "white",
              accessory: duckCustom.accessory || "none",
            });
          } catch (e) {
            console.error("duckCustomJson ?åÏã± ?§Ìå®:", e);
          }
        }

        if (profileData.avatarCustomJson) {
          try {
            const avatarCustom = JSON.parse(profileData.avatarCustomJson);
            setNicknameStyle({
              background: avatarCustom.bgStyle || "default",
              effect: avatarCustom.effect || "none",
            });
          } catch (e) {
            console.error("avatarCustomJson ?åÏã± ?§Ìå®:", e);
          }
        }

        if (profileData.aiDuckbotCustomJson) {
          try {
            const aiDuckbotCustom = JSON.parse(profileData.aiDuckbotCustomJson);
            if (aiDuckbotCustom.model) setDuckBotId(aiDuckbotCustom.model);
          } catch (e) {
            console.error("aiDuckbotCustomJson ?åÏã± ?§Ìå®:", e);
          }
        }
        
        //4. ?îÏïΩ ?ïÎ≥¥ Ï°∞Ìöå
        const summaryData = await getMypageSummary();
        if (summaryData.attendanceDays !== undefined) setConsecutiveDays(summaryData.attendanceDays);
        if (summaryData.sentenceCount !== undefined) setSentenceCount(summaryData.sentenceCount);

        setIsReady(true);

      } catch (error) {
        console.error("?∞Ïù¥??Î°úÎìú ?§Ìå®:", error);
      } finally {
        setIsReady(true);
      }
    };
    fetchItemsAndProfile();
  }, []);

  // ?Ä?•Îêú ?§ÌÅ¨Î¶ΩÌä∏ Ï°∞Ìöå
  useEffect(() => {
    const fetchMyScripts = async () => {
      try {
        const data = await getMyScripts();
        // console.log("[MyPage] API ?ëÎãµ ?ÑÏ≤¥ ?∞Ïù¥??", data);
        // console.log("[MyPage] API ?ëÎãµ ?Ä??", typeof data, Array.isArray(data));

        // Î∞±Ïóî???ëÎãµ??Ïª¥Ìè¨?åÌä∏ ?ïÏãù?ºÎ°ú Î≥Ä??
        const formattedSentences = Array.isArray(data) ? data.map((item, index) => {
          // console.log(`[MyPage] Î¨∏Ïû• ${index} ?êÎ≥∏ ?∞Ïù¥??`, item);
          // console.log(`[MyPage] topic ?ÑÎìú:`, item.topic, item.scriptTopic, item.script?.topic);
          // console.log(`[MyPage] participants ?ÑÎìú:`, item.participants, item.participantNames, item.script?.participants);
          // console.log(`[MyPage] blank_script ?ÑÎìú:`, item.blank_script, item.blankScript);

          // topic ?ÑÎìú ?ïÏù∏ (?¨Îü¨ Í∞Ä?•ÏÑ± Í≥†Î†§)
          const topic = item.topic || item.scriptTopic || item.script?.topic || '';

          // participants ?ÑÎìú ?ïÏù∏ (?¨Îü¨ Í∞Ä?•ÏÑ± Í≥†Î†§)
          let participants = [];
          if (Array.isArray(item.participants)) {
            participants = item.participants;
          } else if (Array.isArray(item.participantNames)) {
            participants = item.participantNames;
          } else if (Array.isArray(item.script?.participants)) {
            participants = item.script.participants;
          }

          // blank_script ?ÑÎìú ?ïÏù∏ Î∞??åÏã±
          const blankScript = item.blank_script || item.blankScript || '';
          let blankWords = [];
          if (blankScript) {
            // [?®Ïñ¥] ?ïÏãù??ÎπàÏπ∏ Ï∂îÏ∂ú
            const matches = blankScript.match(/\[([^\]]+)\]/g);
            if (matches) {
              blankWords = matches.map(match => match.slice(1, -1));
            }
          }

          const formatted = {
            id: item.sentenceId || item.id || item.scriptId,
            english: item.englishSentence || item.english || '',
            korean: item.koreanSentence || item.korean || '',
            topic: topic,
            score: item.score,
            date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : '',
            bookmarked: true,
            speakerName: item.speakerName,
            participants: participants,
            blankScript: blankScript,
            blankWords: blankWords,
            ttsUrl: item.ttsUrl ? `${BACKEND_URL}${item.ttsUrl}` : '',
            similarityPhrases: item.similarityPhrases || []
          };

          // console.log(`[MyPage] Î¨∏Ïû• ${index} ?¨Îß∑ Í≤∞Í≥º:`, formatted);
          return formatted;
        }) : [];

        // console.log("[MyPage] ÏµúÏ¢Ö ?¨Îß∑??Î¨∏Ïû• Î™©Î°ù:", formattedSentences);
        setSentences(formattedSentences);
      } catch (error) {
        console.error("?§ÌÅ¨Î¶ΩÌä∏ Ï°∞Ìöå ?§Ìå®:", error);
        // ?§Ìå® ??Îπ?Î∞∞Ïó¥Î°??§Ï†ï
        setSentences([]);
      }
    };
    fetchMyScripts();
  }, []);


  const stats = [
    { value: "??, label: "?òÎã§DUCKÍ≥??®Íªò ??Î¨∏Ïû• ?∞Ïäµ!" },
    { value: consecutiveDays ?? "??, label: "?∞ÏÜç ?ôÏäµ", unit: "?? },
    { value: sentenceCount ?? "??, label: "?Ä?•Îêú Î¨∏Ïû•", unit: "Í∞? },
  ];

  const handleSentenceClick = (sentence) => {
    // console.log("[MyPage] ?†ÌÉù??Î¨∏Ïû•:", sentence);
    // console.log("[MyPage] Ï£ºÏ†ú:", sentence.topic);
    // console.log("[MyPage] Ï∞∏Ïó¨??", sentence.participants);
    setSelectedSentence(sentence);
  };

  const handleDeleteSentence = (sentenceId) => {
    setSentenceToDelete(sentenceId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!sentenceToDelete) return;

    try {
      await toggleScriptLike(sentenceToDelete, null, null);
      setSentences((prev) => prev.filter((s) => s.id !== sentenceToDelete));
      setSentenceCount((prev) => Math.max(0, prev - 1));
      showToast("Î¨∏Ïû•????†ú?òÏóà?µÎãà??");
    } catch (error) {
      console.error("??†ú ?§Ìå®:", error);
      showToast("??†ú Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.");
    } finally {
      setShowDeleteModal(false);
      setSentenceToDelete(null);
    }
  };

  const handleSaveNicknameStyle = async ({ nickname: newNickname, background, effect }) => {
    try {
      // ?âÎÑ§??Î≥ÄÍ≤?
      if (newNickname && newNickname !== nickname) {
        // console.log('?âÎÑ§??Î≥ÄÍ≤??úÎèÑ:', newNickname);
        const response = await updateNickname({ nickname: newNickname });
        // console.log('?âÎÑ§??Î≥ÄÍ≤??ëÎãµ:', response);
        if (response?.nickname) {
          setNickname(response.nickname);
          // localStorage???âÎÑ§???Ä??(?§Î•∏ ?òÏù¥ÏßÄ?êÏÑú ?¨Ïö©)
          localStorage.setItem('userNickname', response.nickname);
          window.dispatchEvent(new Event('nicknameUpdated'));
        }
      }

      // ?§Ì???Î≥ÄÍ≤?
      // console.log('?§Ì???Î≥ÄÍ≤??úÎèÑ:', { bgStyle: background, effect });
      const styleResponse = await updateAvatarCustom({ bgStyle: background, effect });
      // console.log('?§Ì???Î≥ÄÍ≤??ëÎãµ:', styleResponse);

      // ?ëÎãµ ?åÏã± Î∞?state ?ÖÎç∞?¥Ìä∏
      if (styleResponse?.avatarCustomJson) {
        const avatarCustom = JSON.parse(styleResponse.avatarCustomJson);
        setNicknameStyle({
          background: avatarCustom.bgStyle || background,
          effect: avatarCustom.effect || effect
        });
      } else {
        setNicknameStyle({ background, effect });
      }

      // console.log('?Ä???ÑÎ£å');
    } catch (error) {
      console.error("?Ä???§Ìå®:", error);
      const errorMsg = error.response?.data?.message || error.message || '?????ÜÎäî ?§Î•ò';
      alert(`?Ä???§Ìå®: ${errorMsg}`);
    }
  };

  const handleSaveDuckStyle = async ({ profileId, color, accessory }) => {
    try {
      await updateDuckCustom({ style: profileId, color, accessory });

      // State ?ÖÎç∞?¥Ìä∏
      if (profileId) setDuckProfileId(profileId);
      setDuckStyle({ color, accessory });

      // localStorage ?Ä??(AppHeader ?∞Îèô)
      localStorage.setItem('userProfile', JSON.stringify({
        profileId: profileId || duckProfileId,
        color, accessory
      }));
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (error) {
      console.error("?Ä???§Ìå®:", error);
      const errorMsg = error.response?.data?.message || error.message || '?????ÜÎäî ?§Î•ò';
      alert(`?§Î¶¨ Ïª§Ïä§?∞Îßà?¥Ïßï ?Ä???§Ìå®: ${errorMsg}`);
    }
  };

  const handleSaveDuckBot = async (id) => {
    try {
      await updateAiDuckBot({ model: id });
      setDuckBotId(id);
    } catch (error) {
      console.error('?Ä???§Ìå®:', error);
      const errorMsg = error.response?.data?.message || error.message || '?????ÜÎäî ?§Î•ò';
      alert(`AI ?§Î¶¨Î¥?Î≥ÄÍ≤??§Ìå®: ${errorMsg}`);
    }
  };

  const handleLogout = () => {
    try {
      logout(); 
      navigate("/", { replace: true }); 
    } catch (error) {
      console.error("Î°úÍ∑∏?ÑÏõÉ ?§Ìå®:", error);
      alert("Î°úÍ∑∏?ÑÏõÉ???§Ìå®?àÏäµ?àÎã§.");
    }
  };

  const handlePurchase = async (itemType, itemKey, cost) => {
    if (coins < cost) {
      alert('ÏΩîÏù∏??Î∂ÄÏ°±Ìï©?àÎã§!');
      return false;
    }

    let categoryPrefix = "";
    switch (itemType) {
    case "profile": categoryPrefix = "DUCK_STYLE"; break;
    case "color": categoryPrefix = "DUCK_COLOR"; break;
    case "accessory": categoryPrefix = "DUCK_ACCESSORY"; break;
    case "duckBot": categoryPrefix = "AI_DUCKBOT_MODEL"; break;
    case "background": categoryPrefix = "AVATAR_BG"; break; // ?âÎÑ§??Î™®Îã¨??
    case "effect": categoryPrefix = "AVATAR_EFFECT"; break; // ?âÎÑ§??Î™®Îã¨??
    default: console.error("?????ÜÎäî ?ÑÏù¥???Ä??", itemType); return false;
    }
    const uniqueKey = `${categoryPrefix}:${itemKey}`;

    const numericItemId = itemKeyToIdMap[uniqueKey];
    if (!numericItemId) {
      alert('?ÑÏù¥???ïÎ≥¥Î•?Ï∞æÏùÑ ???ÜÏäµ?àÎã§.');
      return false;
    }

    try {
      const response = await purchaseItem(numericItemId);
      if (response.remainingCoins !== undefined) setCoins(response.remainingCoins);

      // itemTypeÎ≥?unlock Ï≤òÎ¶¨
      const unlockMap = {
        profile: setUnlockedProfiles,
        color: setUnlockedColors,
        accessory: setUnlockedAccessories,
        duckBot: setUnlockedDuckBots,
        background: setUnlockedBackgrounds,
        effect: setUnlockedEffects
      };
      unlockMap[itemType]?.((prev) => [...prev, itemKey]);

      return true;
    } catch (error) {
      console.error('Íµ¨Îß§ ?§Ìå®:', error);
      const errorMsg = error.response?.data?.message || error.message || '?????ÜÎäî ?§Î•ò';
      alert(`?ÑÏù¥??Íµ¨Îß§ ?§Ìå®: ${errorMsg}`);
      return false;
    }
  };

    if (!isReady) {
    return (
      <div className={styles.Page}>
        <div className={styles.Shell}>
          <main className={styles.LoadingWrap} aria-label="Î°úÎî© Ï§?>
            <div className={styles.LoadingCard}>
              {/* ?¥Î? ?∞Í≥† ?àÎäî ?ÑÎ°ú???§Î¶¨ ?¥Î?ÏßÄ ?¨ÏÇ¨??*/}
              <img
                className={styles.LoadingDuck}
                src={DUCK_PROFILE_IMAGES[duckProfileId] ?? DUCK_PROFILE_IMAGES.profile1}
                alt="Î°úÎî© ?§Î¶¨"
              />

              <p className={styles.LoadingTitle}>?§Î¶¨?§Ïù¥ Ï§ÄÎπ?Ï§ëÏù¥?êÏöî??/p>
              <p className={styles.LoadingSub}>
                Ïª§Ïä§?∞Îßà?¥ÏßïÍ≥??µÍ≥ÑÎ•?Î∂àÎü¨?§Îäî Ï§?<span className={styles.Dots} />
              </p>

              <div className={styles.Spinner} aria-hidden="true" />
            </div>
          </main>
        </div>
      </div>
    );
  }


  return (
    <div className={styles.Page}>
      <div className={styles.Shell}>
        <AppHeader userName="" />
        <main className={styles.Main}>
          <ProfileSection
            profileImage={DUCK_PROFILE_IMAGES[duckProfileId]}
            profileColor={duckStyle.color}
            profileAccessory={duckStyle.accessory}
            nickname={nickname}
            nicknameStyle={nicknameStyle}
            duckBotImage={DUCK_BOT_IMAGES[duckBotId]}
            coins={coins}
            onEditProfile={() => setShowDuckModal(true)}
            onEditNickname={() => setShowNicknameModal(true)}
            onEditDuckBot={() => setShowDuckBotModal(true)}
            onLogout={handleLogout}
          />

          <StatsCard stats={stats} />

          <SentenceList
            sentences={sentences}
            onItemClick={handleSentenceClick}
            onDelete={handleDeleteSentence}
          />
        </main>
      </div>

      {toastMessage && <div className={styles.Toast}>{toastMessage}</div>}

      {showDeleteModal && (
        <ConfirmModal
          open={showDeleteModal}
          title="Î¨∏Ïû• ??†ú"
          message="??Î¨∏Ïû•???Ä??Î™©Î°ù?êÏÑú ??†ú?òÏãúÍ≤†Ïäµ?àÍπå?"
          confirmText="?óëÔ∏???†ú"
          cancelText="Ï∑®ÏÜå"
          onConfirm={confirmDelete}
          onClose={() => setShowDeleteModal(false)}
          reverseButtons={true}
        />
      )}

      {selectedSentence && (
        <SentenceDetailModal
          sentence={selectedSentence}
          onClose={() => setSelectedSentence(null)}
        />
      )}

      {showNicknameModal && (
        <NicknameStyleModal
          nickname={nickname}
          currentStyle={nicknameStyle}
          coins={coins}
          unlockedBackgrounds={unlockedBackgrounds}
          unlockedEffects={unlockedEffects}
          onPurchase={handlePurchase}
          onSave={handleSaveNicknameStyle}
          onClose={() => setShowNicknameModal(false)}
        />
      )}

      {showDuckModal && (
        <DuckStyleModal
          currentProfileId={duckProfileId}
          currentColor={duckStyle.color}
          currentAccessory={duckStyle.accessory}
          coins={coins}
          unlockedProfiles={unlockedProfiles}
          unlockedColors={unlockedColors}
          unlockedAccessories={unlockedAccessories}
          onPurchase={handlePurchase}
          onSave={handleSaveDuckStyle}
          onClose={() => setShowDuckModal(false)}
        />
      )}

      {showDuckBotModal && (
        <DuckBotModal
          currentDuckId={duckBotId}
          coins={coins}
          unlockedDuckBots={unlockedDuckBots}
          onPurchase={handlePurchase}
          onSave={handleSaveDuckBot}
          onClose={() => setShowDuckBotModal(false)}
        />
      )}
    </div>
  );
}
