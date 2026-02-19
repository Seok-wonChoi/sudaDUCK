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

## 🛠️ 기술 스택

<a name="stack"></a>

### 🎨 Frontend

<div align="center">

<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black">
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black">
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white">
<img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white">
<img src="https://img.shields.io/badge/OpenVidu-000000?style=for-the-badge&logo=webrtc&logoColor=white">

<br><br>

| Category | Stack |
| :---: | :--- |
| **Language** | JavaScript |
| **Runtime Environment** | Node.js 24.12.0 |
| **Framework** | React 19.2.0, React Router 7.12.0 |
| **Library** | OpenVidu Browser 2.25.0, STOMP.js 7.2.1, SockJS Client 1.6.1,<br> Axios 1.13.4 |
| **Build Tool** | Vite 7.2.4 |
| **IDE** | Visual Studio Code |

</div>

### 💻 Backend

<div align="center">

<img src="https://img.shields.io/badge/SpringBoot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white">
<img src="https://img.shields.io/badge/Java-007396?style=for-the-badge&logo=openjdk&logoColor=white">
<img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white">
<img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white">
<img src="https://img.shields.io/badge/SpringSecurity-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white">
<img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens">
<img src="https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black">

<br><br>

| Category | Stack |
| :---: | :--- |
| **Language** | Java 17 (Eclipse Temurin JDK) |
| **Framework** | Spring Boot 3.5.9 |
| **Library** | Spring Security, Spring Data JPA, Spring Data Redis,<br> Spring Security OAuth2 Client, Spring WebSocket,<br> OpenVidu Java Client 2.25.0, JJWT 0.12.3, Springdoc OpenAPI 2.3.0 |
| **Database** | MySQL 8.0.43, Redis (Alpine) |
| **IDE** | IntelliJ IDEA (Ultimate Edition) |
| **Build Tool** | Gradle 8.14.3 |

</div>

### 🤖 AI Integration

<div align="center">

<img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white">
<img src="https://img.shields.io/badge/Azure_Speech-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white">

<br><br>

| Category | Stack |
| :---: | :--- |
| **LLM Model** | GPT-4o mini |
| **API Service** | MS Cognitive Services Speech 1.47.0 (Azure TTS/STT),<br> OpenAI Whisper API |
| **Feature** | 실시간 발음 평가, 비동기 음성 처리, 문법 교정 |

</div>

### ⚙️ DevOps

<div align="center">

<img src="https://img.shields.io/badge/AWS%20EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white">
<img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white">
<img src="https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge&logo=jenkins&logoColor=white">
<img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white">

<br><br>

| Category | Spec |
| :---: | :--- |
| **Instance Type** | AWS EC2 (Ubuntu 20.04 LTS) |
| **Container** | Docker Engine, Docker Compose v3.8 |
| **CI/CD** | Jenkins LTS (Docker-in-Docker) |
| **Web Server** | Nginx Latest |
| **Media Server** | OpenVidu Server 2.25.0 (Pro Edition / Host Network) |
| **Notification** | Mattermost Webhook |

</div>

### 🤝 Collaboration

<div align="center">

<img src="https://img.shields.io/badge/GitLab-FC6D26?style=for-the-badge&logo=gitlab&logoColor=white">
<img src="https://img.shields.io/badge/Jira-0052CC?style=for-the-badge&logo=jira&logoColor=white">
<img src="https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=white">
<img src="https://img.shields.io/badge/Mattermost-0072C6?style=for-the-badge&logo=mattermost&logoColor=white">
<img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white">
<img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white">

</div>
<br>

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