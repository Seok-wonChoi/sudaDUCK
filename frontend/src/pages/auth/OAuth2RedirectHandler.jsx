import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    console.log('[OAuth2] 리다이렉트 핸들러 실행');
    console.log('[OAuth2] 전체 URL:', window.location.href);

    // URL에서 토큰 추출 (여러 가능한 파라미터 이름 시도)
    const urlToken = searchParams.get('token')
      || searchParams.get('accessToken')
      || searchParams.get('access_token');
    const error = searchParams.get('error');

    // 개발/테스트용 임시 토큰 (백엔드 OAuth 설정 전까지 사용)
    // TODO: 백엔드 OAuth 연동 완료 후 이 변수 제거
    const TEMP_TOKEN = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJ3anNkdXN0bjExMjlAbmF2ZXIuY29tIiwidXNlcklkIjo0NzE5MDU3OTEyLCJpYXQiOjE3Njk1ODA2NjMsImV4cCI6MTc2OTU4NDI2M30.PXTjUKNK7RSXL0bBvlmOAB4bG-ITv3y4YX9qh4O6hGprgXt31q2BdCaSINKhHW4t3p-j9weMBU4Xtv6pzWu0vg";

    // URL에서 토큰을 받으면 우선 사용, 없으면 임시 토큰 사용
    const finalToken = urlToken || TEMP_TOKEN;

    console.log('[OAuth2] URL에서 추출된 토큰:', urlToken ? `${urlToken.substring(0, 20)}...` : 'null');
    console.log('[OAuth2] 최종 사용 토큰:', finalToken ? `${finalToken.substring(0, 20)}...` : 'null');
    console.log('[OAuth2] 에러:', error);

    if (error) {
      console.error('OAuth2 로그인 실패:', error);
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
      navigate('/login');
      return;
    }

    if (finalToken) {
      // 토큰을 localStorage에 저장
      localStorage.setItem('accessToken', finalToken);
      console.log('[OAuth2] 토큰 저장 완료');
      console.log('[OAuth2] 메인 페이지로 이동');

      // 메인 페이지로 이동
      navigate('/', { replace: true });
    } else {
      console.error('[OAuth2] 토큰을 찾을 수 없습니다.');
      console.error('[OAuth2] 쿼리 파라미터:', Object.fromEntries(searchParams.entries()));
      alert('로그인 처리 중 오류가 발생했습니다. 토큰을 찾을 수 없습니다.');
      navigate('/login');
    }
  }, [navigate, searchParams]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#6b7280'
    }}>
      로그인 처리 중...
    </div>
  );
}
