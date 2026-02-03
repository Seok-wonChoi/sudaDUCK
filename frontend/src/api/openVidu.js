import api from './api';

/*
### ⚡ 프론트엔드 흐름 요약

**[방장 (Host)]**
1. `POST /openvidu/sessions` → **세션 ID** 획득 (`ses_123`)
2. `POST /rooms` (Body에 `openviduSessionId: "ses_123"` 포함) → **방 생성 완료**
3. `POST /openvidu/.../connections` → **토큰** 획득 → 입장!

**[참가자 (Guest)]**
1. `POST /rooms/join` → 응답에서 **세션 ID** 확인 (`ses_123`)
2. `POST /openvidu/.../connections` (URL에 `ses_123` 넣음) → **토큰** 획득 → 입장!
*/

// 방 만들기(Session 생성)
export const createSession = async (sessionId) => {
    const response = await api.post('/api/v1/openvidu/sessions', { customSessionId : sessionId });
    return response.data;
}

//입장권 받기 (Token 생성)
export const createToken = async (sessionId) => {
    const response = await api.post(`/api/v1/openvidu/sessions/${sessionId}/connections`, {});
    return response.data;
}