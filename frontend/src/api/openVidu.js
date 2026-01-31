import api from './api';

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