# 🦆 수다DUCK (SudaDUCK)

<div align="center">

<img src="assets/images/duck_together.png" width="300"/>

### **"친구들과 수다 떨듯 가볍게 배우는 AI 실시간 영어 회화"**

지루한 공부는 이제 그만! AI와 친구들이 함께 어울리는 실시간 상호작용 학습 플랫폼입니다.

</div>

<br><br>

## 프로젝트 소개

현대인들에게 영어 공부는 늘 숙제 같고 지루한 영역입니다. **수다DUCK**은 이러한 심리적 장벽을 허물기 위해 탄생했습니다.

- **실전 중심 소통:** 텍스트 위주의 학습에서 벗어나 STT/TTS 기반의 실시간 음성 대화를 지향합니다.
- **재미있는 복습:** 게이미피케이션 요소를 도입하여 학습이 아닌 '놀이'처럼 영어를 익힙니다.

<br><br>

## 프로젝트 기간
전체 프로젝트 기간 : 2026-01-06 ~ 2026-02-09

<br><br>

## 팀원 소개

| **김가민 (팀장 / BE)** |
| :--- |
| • 프로젝트 총괄 및 프로젝트 일정 관리 |
| • 전반적인 백엔드 API 개발 |
| • Spring Security & JWT 기반 Stateless 인증/인가 시스템 구축 |
| • OAuth 2.0 (Kakao) 소셜 로그인 연동 및 회원 관리 로직 구현 |
| • Redis 자료구조(Hash, Set)를 활용한 실시간 데이터 캐싱 설계 |
| • Redis(In-Memory) ↔ MySQL(Disk) 간 데이터 이관 파이프라인 및 정합성 보장 로직 구현 |
| • MySQL DB 스키마 설계 및 JPA 연관관계 매핑 최적화 |
| • **프로젝트 최종, 본선 발표 전담** |

<br>

| **장가은 (BE)** |
| :--- |
| • 전반적인 백엔드 API 개발 |
| • 대기방·게임방 상태 관리 로직 설계 |
| • OpenVidu 기반 WebRTC 연동 및 실시간 통신 처리 |
| • WebSocket(STOMP) 기반 방 상태·준비 상태 동기화 |
| • Redis 캐싱 적용 |

<br>

| **이승엽 (Infra)** |
| :--- |
| • Docker 기반 Dev/Prod 환경 격리 및 가상 네트워크 설계 |
| • Jenkins Pipeline을 활용한 CI/CD |
| • Blue-Green 무중단 배포 구현 |
| • Mattermost Webhook 기반 실시간 배포 알림 자동화 |
| • API 연동 통합 디버깅 지원 및 UI/UX 개선 협력 |

<br>

| **전연수 (FE)** |
| :--- |
| • UI/UX 디자인 시안 기반 프론트엔드 퍼블리싱 (React/Vite) |
| • 공통 레이아웃/컴포넌트 구현 및 페이지 UI 구성 |
| • 백엔드 API 연동(Axios) 및 응답 데이터 기반 화면 처리 |
| • 기획 발표 자료 구성 및 발표 |
| • 프로젝트 소개 영상 포트폴리오(UCC) 기획·촬영·편집 |

<br>

| **최석원 (FE)** |
| :--- |
| • UI/UX 설계 및 React 기반 화면 구현 |
| • WebSocket 연동을 통한 실시간 UI 처리 |
| • 음성 녹음 기능 구현 및 사용자 흐름 제어 |
| • 공통 컴포넌트 및 프론트엔드 구조 정리 |
| • API 연동 및 프론트엔드 상태 관리 |

<br>

| **최현웅 (AI)** |
| :--- |
| • AI 기능 전반 설계 및 개발 |
| • 비동기 음성 처리 파이프라인 구축 (STT → 전처리 → GPT 번역 → TTS) |
| • Redis 기반 동시 입력 순서 보장 시스템 구현 |
| • GPT-4o-mini 활용 주제 추천·번역·퀴즈 생성 |
| • 실시간 돌발 퀴즈 이벤트 및 발음 평가 시스템 |

<br><br>

## 주요 기능

<table width="100%"> 
  <tr> 
    <td width="50%" align="center"><b>한국어로 함께 대화하기</b></td> 
    <td width="50%" align="center"><b>AI 영어 스크립트 & 발화 평가</b></td> 
  </tr> 
  <tr> 
    <td align="center" style="vertical-align: top;"> 
      <img src="assets/images/talk1.png" width="100%" alt="실시간 음성 입력"/>
    </td>
    <td align="center" style="vertical-align: top;">
      <img src="assets/gifs/assessment.gif" width="100%" alt="스크립트 생성"/>
    </td> 
  </tr> 
</table>

<table width="100%"> 
  <tr> 
    <td width="50%" align="center"><b>복습 게임</b></td> 
    <td width="50%" align="center"><b>마이페이지</b></td> 
  </tr> 
  <tr> 
    <td align="center" style="vertical-align: top;"> 
      <img src="assets/gifs/review.gif" width="100%" alt="복습 게임 시작"/>
    </td>
    <td align="center" style="vertical-align: top;">
      <img src="assets/gifs/myPage.gif" width="100%" alt="프로필 관리"/>
    </td> 
  </tr> 
</table>

<br><br>

## 기술 스택

### Development
| 분류 | 기술 스택 | 상세 역할 |
| :--- | :--- | :--- |
| **Frontend** | `React` | 컴포넌트 기반 아키텍처를 통한 UI 재사용성 확보 |
| **Backend** | `Java`, `Spring Boot` | 비즈니스 로직 및 서비스 안정성 구축 |
| **Security** | `Spring Security`, `JPA` | 보안 체계 및 데이터 영속성 관리 |
| **Database** | `MySQL 8.0` | 사용자 정보 및 대화 로그 등 영구 데이터 관리 |
| **Caching** | `Redis` | 세션 관리, 실시간 턴 관리 및 타이머 데이터 캐싱 |
| **Real-time** | `OpenVidu (SFU)`, `WebSocket` | WebRTC 기반 안정적인 미디어 스트리밍 및 실시간 통신 |

### AI Integration
| 분류 | 기술 스택 | 상세 역할 |
| :--- | :--- | :--- |
| **LLM** | `GPT-4o mini` | 문법 교정, 학습 스크립트/퀴즈 생성 및 비속어 필터링 |
| **STT** | `Whisper API` | 고성능 음성 인식 및 데이터 전처리 |
| **Voice** | `Azure Speech` | 자연스러운 가이드 음성 합성(TTS) 및 발음 평가 피드백 |

<br><br>

## Project Documents

수다DUCK의 상세 기획 및 설계 내용은 아래 문서에서 확인하실 수 있습니다.

| 문서명 | 링크/경로 |
| :--- | :--- |
| 포팅 매뉴얼 | [`./exec/포팅메뉴얼.md`](./exec/포팅메뉴얼.md) |
| 요구사항 명세서 | [바로가기 (Notion)](https://www.notion.so/2e8826715e6280ce8f26cea5c674f82a?pvs=21) |
| API 명세서 | [바로가기 (Notion)](https://www.notion.so/API-2ea826715e628000bcfadb7d9bd88d41?pvs=21) |

<br><br>

## Data Modeling

<img src="assets/images/erd.png" width="100%"/>

<br><br>

## 시스템 아키텍처

<img src="assets/images/architecture.png" width="100%"/>

