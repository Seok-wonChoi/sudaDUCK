import NicknameBadge from "./NicknameBadge";
import duckImage from "@/assets/images/duck.png";

export default function ProfileSection({
  profileImage,
  nickname = "user",
  email = "example@test.com",
  nicknameStyle = { background: "gradient", effect: null },
  duckColor = "yellow",
  duckAccessory = null,
  onEditProfile,
  onEditNickname,
  onEditDuck,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-5 py-6">
      <div className="flex items-end">
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100">
            {profileImage ? (
              <img src={profileImage} alt="프로필" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-200 to-indigo-300" />
            )}
          </div>
          <button
            type="button"
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full border-2 border-white
              bg-white cursor-pointer flex items-center justify-center shadow-md hover:bg-gray-50"
            onClick={onEditProfile}
            aria-label="프로필 사진 변경"
          >
            <span className="text-sm">📷</span>
          </button>
        </div>

        <div className="relative -ml-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-amber-100">
            <img src={duckImage} alt="AI 오리" className="w-full h-full object-cover" />
          </div>
          <button
            type="button"
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full border-2 border-white
              bg-white cursor-pointer flex items-center justify-center shadow-md hover:bg-gray-50"
            onClick={onEditDuck}
            aria-label="AI 오리 스타일 변경"
          >
            <span className="text-sm">✏️</span>
          </button>
        </div>
      </div>

      <div className="flex-1 w-full sm:w-auto bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-2xl py-5 px-6 text-white">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <NicknameBadge nickname={nickname} style={nicknameStyle} />
          <button
            type="button"
            className="bg-transparent border-none cursor-pointer p-1 flex items-center justify-center opacity-80 hover:opacity-100"
            onClick={onEditNickname}
            aria-label="닉네임 스타일 변경"
          >
            <span>✏️</span>
          </button>
        </div>
        <div className="mt-1 text-sm opacity-90 text-center sm:text-left">{email}</div>
      </div>
    </div>
  );
}
