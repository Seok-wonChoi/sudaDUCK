# 📝 주간 학습 리포트: AI 기반 실시간 영어 회화 서비스

## 1. 서비스 프로세스

### STEP 0. 방 생성 및 대기

- **방 생성:** 방장이 최대 4인 규모의 방 생성 및 학습 주제 선정.
- **주제 추천:** 주제 선택이 어려울 경우 AI가 OPIc 빈출 주제나 일상 대화 토픽 5개를 실시간 제안.
- **시작:** 모든 참여자가 'Ready' 완료 시 세션 시작.

### STEP 1. 실시간 대화

- **진행 방식:** 1~2분간 한국어로 자유롭게 대화.
- **초저지연 파이프라인:** 1. **FE(브라우저):** 각 유저의 음성을 Web Speech API로 즉시 STT 변환하여 텍스트 데이터만 서버로 전송. 2. **AI 서버:** 전송받은 한글 텍스트를 AI가 백그라운드에서 실시간 영작 및 가공.
- **AI NPC 참견:** AI가 실시간 대화 맥락을 모니터링하다가 5초 이상 정적 발생 시, 이전 대화와 연결되는 질문을 던져 대화 유도.

### STEP 2. 스크립트 리뷰

- **대기 시간 제로:** 대화 종료와 동시에 백그라운드에서 완성된 영어 스크립트가 화면에 즉시 표출.
- **원어민 피드백:** AI TTS를 통해 모든 문장의 원어민 발음 제공 (지연 최소화를 위해 스트리밍 방식 적용).
- **개인 저장:** 학습하고 싶은 문장에 '좋아요' 클릭 시 마이페이지 보관함에 즉시 저장.

### STEP 3. 게이미피케이션 학습

- **정밀 발음 평가:** 스크립트 중 주요 문장을 따라 읽고, AI가 발음평가.
- **돌발 이벤트:** \* **영어 퀴즈:** 대화 중 언급된 단어를 활용해 AI가 기습 질문을 던지면 턴제로 답변.
  - **스피드 빈칸:** 지난 대화 문장의 핵심 단어를 가장 먼저 맞히는 경쟁 모드.
  - **떼창 모드:** 핵심 문장을 전원이 동시에 3번 외쳐야 세션 최종 종료 (협동 미션).

### STEP 4. 결과 리포트 및 보상

- **성과 분석:** 발음 점수, 퀴즈 정답률을 합산해 세션 MVP 선정.
- **보상:** 순위에 따라 아바타 꾸미기용 코인 지급.
- **자동 오답 노트:** 발음 점수가 일정 점수 미만인 문장은 보관함에 자동으로 등록.

---

## 2. 기술 스택 (Tech Stack)

| 분류          | 기술 스택             | 상세 역할                                                          |
| :------------ | :-------------------- | :----------------------------------------------------------------- |
| STT           | Chrome Web Speech API | 클라이언트단에서 한국어 음성을 텍스트로 즉시 변환 (서버 부하 방지) |
| LLM (Main)    | GPT-4o-mini           | 실시간 KR-EN 번역, 빈칸 생성, 주제 추천 (속도 및 비용 최적화)      |
| LLM (Agent)   | Claude-3.5-Haiku      | 대화 맥락 파악 및 실시간 NPC 참견/질문 생성                        |
| Pronunciation | Azure AI Speech       | 사용자 발음의 정확도(Accuracy), 유창성(Fluency) 정밀 평가          |
| TTS           | Azure Neural TTS      | 원어민 발음 스트리밍 제공 (지연 시간 0.5초 이내 목표)              |
| Backend       | FastAPI + WebSocket   | AI 파이프라인 제어 및 실시간 양방향 데이터 통신                    |
| Database      | Redis                 | 실시간 대화 Context 및 임시 데이터 캐싱                            |

---

## 3. AI 주요 기능 상세

| 기능 영역       | 구현 항목                    | 추천 모델 및 방법                                                                                                                   |
| :-------------- | :--------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **대화 처리**   | 실시간 영작 및 스크립트 생성 | 모델: GPT-4o-mini (속도) 또는 GPT-4o (품질)<br>방법: STT 텍스트를 "자연스러운 대화체 영문"으로 번역 요청.                           |
| **학습 엔진**   | 빈칸(Blank) 자동 생성        | 모델: LLM (Few-shot Prompting)<br>방법: 영문 스크립트에서 학습 가치가 높은 핵심 숙어/단어를 AI가 추출하여 [ ] 처리.                 |
| **발음 평가**   | 정확도 및 유창성 채점        | 모델: Azure Speech 서비스 (Pronunciation Assessment)<br>방법: 유저 녹음 파일과 정답 텍스트를 Azure API로 전송하여 실시간 점수 수신. |
| **음성 합성**   | 원어민 발음 TTS              | 모델: OpenAI TTS (tts-1) 또는 Azure Neural TTS<br>방법: 생성된 영문 스크립트를 즉시 음성으로 변환 및 스트리밍.                      |
| **게임/이벤트** | 돌발 퀴즈 생성               | 모델: LLM<br>방법: 이전 세션 데이터를 기반으로 퀴즈 및 '문장 비' 게임용 데이터 가공.                                                |

---

## 4. 기능 분배 (System Role)

| 기능           | Spring Boot (BE)        | FastAPI (AI)                           |
| :------------- | :---------------------- | :------------------------------------- |
| **방 관리**    | 방 ID 생성, 참여자 매칭 | 주제 추천 AI API 제공                  |
| **자유 토크**  | 대화 세션 시간 관리     | 실시간 영작, 빈칸 생성, 참견 질문 생성 |
| **스크립트**   | DB 저장 및 불러오기     | 실시간 텍스트 가공 및 전달             |
| **게임/평가**  | 점수 합산 및 MVP 선정   | Azure 기반 발음 채점, 퀴즈 생성        |
| **마이페이지** | 보관함 문장 리스트 조회 | 유사 표현 추천                         |

---

## 5. 테스트 코드: Azure 발음 평가 (FastAPI)

```python
from dotenv import load_dotenv
import os
from fastapi import FastAPI, UploadFile, Form, File
import azure.cognitiveservices.speech as speechsdk

app = FastAPI()

load_dotenv()
AZURE_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_REGION = os.getenv("AZURE_REGION")

@app.post("/evaluate-pronunciation")
async def evaluate(
    reference_text: str = Form(...),
    audio_file: UploadFile = File(...)
):
    # 1. 오디오 파일 임시 저장
    audio_content = await audio_file.read()
    with open("temp_audio.wav", "wb") as f:
        f.write(audio_content)

    # 2. Azure 발음 평가 설정
    speech_config = speechsdk.SpeechConfig(subscription=AZURE_KEY, region=AZURE_REGION)
    audio_config = speechsdk.audio.AudioConfig(filename="temp_audio.wav")

    pronunciation_config = speechsdk.PronunciationAssessmentConfig(
        reference_text=reference_text,
        grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
        granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
        enable_miscue=True
    )

    # 3. 평가 실행
    recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)
    pronunciation_config.apply_to(recognizer)

    result = recognizer.recognize_once()

    # 4. 결과 파싱 및 반환
    if result.reason == speechsdk.ResultReason.RecognizedSpeech:
        assessment_result = speechsdk.PronunciationAssessmentResult(result)
        return {
            "accuracy_score": assessment_result.accuracy_score,
            "fluency_score": assessment_result.fluency_score,
            "pronunciation_score": assessment_result.pronunciation_score,
        }
    else:
        return {"error": "평가 실패. 음성을 확인해주세요."}
```
