import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // URL에서 토큰 추출 (백엔드가 보내는 파라미터 이름에 따라 조정 필요)
    const token = searchParams.get('token') || searchParams.get('accessToken');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth2 로그인 실패:', error);
      alert('로그인에 실패했습니다. 다시 시도해주세요.');
      navigate('/login');
      return;
    }

    if (token) {
      // 토큰을 localStorage에 저장
      localStorage.setItem('accessToken', token);

      // 메인 페이지로 이동
      navigate('/', { replace: true });
    } else {
      console.error('토큰을 찾을 수 없습니다.');
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
