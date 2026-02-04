import { getMyProfileCustom } from "@/api/mypage";

export async function loadDuckProfileToLocalStorage() {
  const profileData = await getMyProfileCustom();
  const duckJson = profileData?.duckCustomJson;
  if (!duckJson) return;

  let duck;
  try {
    duck = typeof duckJson === "string" ? JSON.parse(duckJson) : duckJson;
  } catch (e) {
    console.error("duckCustomJson 파싱 실패:", e);
    return;
  }

  const profileForHeader = {
    profileId: duck.style || "profile1",
    color: duck.color || "white",
    accessory: duck.accessory && duck.accessory !== "none" ? duck.accessory : null,
  };

  localStorage.setItem("userProfile", JSON.stringify(profileForHeader));
  window.dispatchEvent(new Event("profileUpdated"));
}
