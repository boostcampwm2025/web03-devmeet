# 🍀 dev:meet - 코드와 설계, 대화의 맥락이 하나로 이어지는 공간

<img width="7680" height="4320" alt="Image" src="https://github.com/user-attachments/assets/d31ac372-65a2-420c-8957-a568f2aba90c" />

## 🛎️ 서비스 소개

> 서비스 URL: https://www.devmeet.p-e.kr/

`"화상 회의 따로, 설계 따로, 코드 공유 따로... 번거로운 협업은 이제 그만!"`

- dev:meet는
  화상 회의, 실시간 코드 편집, 화이트보드를 하나의 브라우저 탭에서 통합 제공하는
  개발자 전용 실시간 협업 플랫폼입니다.

- 서비스 URL: https://www.devmeet.p-e.kr/

- 대상 사용자: 개발자 / 페어 프로그래밍 / 기술 회의

```
dev:meet는 분리된 협업 도구로 인한 비효율을 하나의 흐름으로 통합합니다.
```

## ❓ 문제 정의

### 기존 협업 환경의 한계

프로젝트 회의나 페어 프로그래밍 시, 우리는 여러 도구를 병행 사용합니다.

| 사용 목적         | 도구               |
| ----------------- | ------------------ |
| 화상 회의         | Zoom, Google Meet  |
| 코드 공유         | VS Code Live Share |
| 설계 / 다이어그램 | excalidraw, Miro   |

이러한 도구 파편화는 다음과 같은 문제를 발생시킵니다.

- 문제점
  - 컨텍스트 스위칭 비용: 툴 전환이 잦아질수록 집중력 저하 및 논의 흐름 단절
  - 협업 환경 설정 비용: 페어 프로그래밍을 위한 세션 생성, 권한 설정의 번거로움
  - 표현력의 한계: 코드 블럭만으로는 아키텍처, 로직 흐름 설명에 제약

### 🎯 해결 목표

```
“개발자가 협업을 위해 여러 도구를 오가는 비효율을 줄이고,
하나의 공간에서 실시간 소통과 구현이 자연스럽게 이루어지도록 한다.”
```

- 협업 흐름을 단일 컨텍스트로 통합
- 실시간 미디어 환경에서도 안정적인 성능 유지
- 개발 회의에 최적화된 UX 제공

➡️ **dev:meet는 이 모든 과정을 하나로 합쳐, 오직 '개발'과 '소통'에만 집중할 수 있는 환경을 제공합니다.**

<br/>

## ⭐ 서비스 주요 기능

### 1️⃣ 그룹 화상 회의 & 화면 공유

- WebRTC (SFU) 기반 실시간 화상/음성 통화
- 화면 공유 및 발표자 전환 지원
- 참여자 수 증가 시에도 안정적인 미디어 처리

![Image](https://github.com/user-attachments/assets/018c93a1-60d8-45da-92fb-3dc78afe8adf)

### 2️⃣ 실시간 동기화 코드 에디터

- 기능
  - Monaco Editor 기반 코드 편집 환경
  - 자동 완성, 문법 하이라이팅, 에러 감지 지원
  - 다중 사용자 실시간 편집 동기화

- 활용 시나리오
  - 페어 프로그래밍
  - 라이브 코딩 리뷰
  - 알고리즘 풀이 스터디

![Image](https://github.com/user-attachments/assets/78553390-ab7a-4c69-a702-dea2d7a60887)

### 3️⃣ 공유 화이트보드

- 기능
  - Canvas API 기반 자유 드로잉
  - 아키텍처 다이어그램 및 흐름도 시각화
  - 회의 중 즉각적인 아이디어 공유

- 활용 시나리오
  - 시스템 설계 설명
  - 로직 흐름 정리
  - 브레인스토밍

![Image](https://github.com/user-attachments/assets/670f3b67-02d9-4ed2-bdfa-c712bff96ffa)

### 4️⃣ 실시간 채팅

- 회의 중 메시지 송수신
- 링크 및 파일(사진, 동영상, 문서 등) 공유
- 미디어 통화와 분리된 보조 커뮤니케이션 채널

![Image](https://github.com/user-attachments/assets/af0279ee-83ba-4bd9-a0dc-80ce31122aaf)

### 5️⃣ 추후 확장 방향

- 화면 스플릿 기능을 통한 화이트보드, 코드 에디터 동시 작업
- 화이트보드, 코드 에디터 결과물 저장 및 파일로 내보내기
- Mermaid 코드 → 다이어그램 변환
- 가상 배경 추가

<br/>

### 기술 스택

- Collaboration & Tools

  <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white"/> <img src="https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=white"/> <img src="https://img.shields.io/badge/Slack-4A154B?style=for-the-badge&logo=slack&logoColor=white"/> <img src="https://img.shields.io/badge/Gitflow-F05032?style=for-the-badge&logo=git&logoColor=white"/>

- Frontend

  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white"/> <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white"/> <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white"/> <img src="https://img.shields.io/badge/Zustand-443E38?style=for-the-badge&logo=react&logoColor=white"/> <img src="https://img.shields.io/badge/Konva-0D83CD?style=for-the-badge&logo=konva&logoColor=white"/> <img src="https://img.shields.io/badge/Monaco%20Editor-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white"/> <img src="https://img.shields.io/badge/Yjs-D14836?style=for-the-badge&logo=yjs&logoColor=white"/>

- Backend

  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white"/> <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white"/> <img src="https://img.shields.io/badge/MySQL2-4479A1?style=for-the-badge&logo=mysql&logoColor=white"/> <img src="https://img.shields.io/badge/mediasoup-WebRTC-FF6F00?style=for-the-badge&logo=webrtc&logoColor=white"/> <img src="https://img.shields.io/badge/AWS%20SDK-Amazon-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white"/>

- Infra

  <img src="https://img.shields.io/badge/Naver%20Cloud%20Platform-03C75A?style=for-the-badge&logo=naver&logoColor=white"/> <img src="https://img.shields.io/badge/AWS%20S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white"/> <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"/> <img src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white"/> <img src="https://img.shields.io/badge/Kafka-231F20?style=for-the-badge&logo=apachekafka&logoColor=white"/> <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white"/> <img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white"/> <img src="https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white"/>

<br/>

## 🏗️ 아키텍처

<br/>

## 🚀 빌드 & 실행 (One-shot)

### 1. 저장소 clone

```bash
git clone https://github.com/boostcampwm2025/web03-devmeet.git
cd devmeet
```

### 2. 환경변수 설정

각 서비스별로 .env.example 파일을 기반으로 .env 파일을 생성합니다.

<details>
  <summary>
  <b>
  [frontend/.env.example]
  </b>
  </summary>

```bash
# 소켓 통신 및 공통 서버 기본 주소
# 예: https://api.devmeet.p-e.kr
NEXT_PUBLIC_SERVER_URL=""

# REST API 호출에 사용되는 API 서버 주소
# 예: https://api.devmeet.p-e.kr
NEXT_PUBLIC_API_SERVER_URL=""

# 실시간 협업 툴(코드 에디터, 화이트보드) 백엔드 기본 주소
# 예: https://tool.devmeet.p-e.kr
NEXT_PUBLIC_TOOL_BACKEND_URL=""

# WebSocket 공통 prefix
# 예: /ws
NEXT_PUBLIC_TOOL_BACKEND_WEBSOCKET_PREFIX=""

# 실시간 코드 에디터 WebSocket 엔드포인트
# 예: /code-editor
NEXT_PUBLIC_TOOL_BACKEND_WEBSOCKET_CODEEDITOR=""

# 화이트보드 WebSocket 엔드포인트
# 예: /whiteboard
NEXT_PUBLIC_TOOL_BACKEND_WEBSOCKET_WHITEBOARD=""
```

</details>

<details>
  <summary>
  <b>
  [rep/main_backend/.env.example]
  </b>
  </summary>

```bash
# 기본 서버 설정
NODE_PORT=
NODE_HOST=""
NODE_ENV=""
NODE_BACKEND_PREFIX=""
NODE_BACKEND_WEBSOCKET_PREFIX=""
NODE_BACKEND_SERVER=""
NODE_FRONTEND_SERVER=""

# CORS 설정
NODE_ALLOWED_ORIGIN=
NODE_ALLOWED_METHODS=
NODE_ALLOWED_HEADERS=
NODE_ALLOWED_CREDENTIALS=
NODE_ALLOWED_EXPOSE_HEADERS=

# Database 설정
NODE_APP_DATABASE_HOST=
NODE_APP_DATABASE_PORT=
NODE_APP_DATABASE_NAME=""
NODE_APP_DATABASE_USER=
NODE_APP_DATABASE_PASSWORD=

# Redis 설정
NODE_APP_REDIS_URL=
NODE_APP_REDIS_PASSWORD=

# JWT 설정
NODE_APP_JWT_ACCESS_SECRET_KEY=
NODE_APP_JWT_ACCESS_EXPIRED_TIME=""
NODE_APP_JWT_REFRESH_SECRET_KEY=""
NODE_APP_JWT_REFRESH_EXPIRED_TIME=""
NODE_APP_JWT_ISSUE_NAME=""
NODE_APP_JWT_AUDIENCE_NAME=""
NODE_APP_JWT_ALGORITHM="HS256"

# Kakao OAuth 설정
NODE_APP_KAKAO_REST_API_KEY=""
NODE_APP_KAKAO_CLIENT_SECRET=""

# AWS S3 설정
NODE_APP_AWS_ACCESS_KEY=""
NODE_APP_AWS_SECRET_KEY=""
NODE_APP_AWS_BUCKET_NAME=""
NODE_APP_AWS_REGION_NAME=""
NODE_APP_AWS_PRESIGNED_URL_EXPIRES_SEC=

# Kafka 설정
NODE_APP_KAFKA_BROKERS=""
NODE_APP_KAFKA_CLIENT_ID=""
NODE_APP_KAFKA_GROUP_ID=""
NODE_APP_KAFKA_SASL_USERNAME=""
NODE_APP_KAFKA_SASL_PASSWORD=""
NODE_APP_KAFKA_SASL_MECHANISM=""
NODE_APP_KAFKA_SSL=""

# 화상 회의 (SFU) 설정
NODE_APP_SFU_PUBLIC_IP=""

# Tool Backend 협업 인증 설정
NODE_APP_TICKET_PRIVATE_JWK=""
NODE_APP_TICKET_PUBLIC_JWK=""
NODE_APP_TICKET_ISS="main_backend"
NODE_APP_TICKET_AUD="tool_backend"

# Prometheus 설정
NODE_APP_PROMETHEUS_DEFAULT_PREFIX="main_backend_"
NODE_APP_PROMETHEUS_SERVICE_LABEL="main-backend"
NODE_APP_PROMETHEUS_SERVICE_ENV="local"
```

</details>

<details>
  <summary>
  <b>
  [rep/tool_backend/.env.example]
  </b>
  </summary>

```bash
# 기본 서버 설정
NODE_PORT=8000
NODE_HOST="0.0.0.0"

# 실행 환경 (local | development | deployment)
NODE_ENV="deployment"
NODE_BACKEND_PREFIX="tool"

# CORS 설정
NODE_ALLOWED_ORIGIN=""
NODE_ALLOWED_METHODS="GET,POST,PUT,DELETE,PATCH"
NODE_ALLOWED_HEADERS="Content-Type, Accept, Authorization"
NODE_ALLOWED_CREDENTIALS="true"

# Database 설정
NODE_APP_DATABASE_HOST=""
NODE_APP_DATABASE_PORT=3307
NODE_APP_DATABASE_NAME=""
NODE_APP_DATABASE_USER=""
NODE_APP_DATABASE_PASSWORD=""

# Redis 설정

# 예: redis://localhost:6379
NODE_APP_REDIS_URL=""
NODE_APP_REDIS_PASSWORD=""

# Kafka 브로커 주소
# 예: localhost:9092
NODE_APP_KAFKA_BROKERS=""
# Kafka Client ID
NODE_APP_KAFKA_CLIENT_ID="tool_backend"
# Kafka Consumer Group ID
NODE_APP_KAFKA_GROUP_ID="tool-backend"
# SASL 인증 정보
NODE_APP_KAFKA_SASL_USERNAME=""
NODE_APP_KAFKA_SASL_PASSWORD=""
NODE_APP_KAFKA_SASL_MECHANISM=""

# SSL 사용 여부
NODE_APP_KAFKA_SSL="false"

# WebSocket 설정
NODE_BACKEND_WEBSOCKET_PREFIX="/tool/ws"
NODE_BACKEND_WEBSOCKET_WHITEBOARD="/whiteboard"
NODE_BACKEND_WEBSOCKET_CODEEDITOR="/codeeditor"

# JWK 검증 설정
# main_backend 에서 발급한 Public JWK (JSON 문자열)
NODE_APP_TICKET_PUBLIC_JWK=""
# 토큰 발급자
NODE_APP_TICKET_ISS="main_backend"
# 토큰 대상자
NODE_APP_TICKET_AUD="tool_backend"

# Prometheus 설정
NODE_APP_PROMETHEUS_DEFAULT_PREFIX="tool_backend_"
NODE_APP_PROMETHEUS_SERVICE_LABEL="tool-backend"
NODE_APP_PROMETHEUS_SERVICE_ENV="local"
```

</details>

<br/>

**frontend**

```bash
cd frontend
cp .env.example .env.local
```

**main_backend**

```bash
cd backend/main
cp .env.example .env
```

**tool_backend**

```bash
cd backend/tool
cp .env.example .env
```

⚠️ 실제 서버 주소, DB 정보, 인증 키 값은 .env 파일에 직접 입력해야 합니다.

<br/>

### 3. 개발 모드 실행

Docker 없이 개별 서비스 단독 실행도 가능합니다.

### Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

### Backend

```bash
cd rep/main_backend
pnpm install
pnpm start:dev
```

```bash
cd rep/tool_backend
pnpm install
pnpm start:dev
```

<br/>

## ⛏️ 문제 해결 과정 및 기술 경험

### [FE] 통화 음질 개선

- 작성자: Tony (윤장호)
- 링크: [[FE] 통화 음질 개선](https://github.com/boostcampwm2025/web03-devmeet/wiki/%5BFE%5D-%ED%86%B5%ED%99%94-%EC%9D%8C%EC%A7%88-%EA%B0%9C%EC%84%A0)

<br/>

## 🦉 Team OwlCloud 소개

<img width="1600" alt="image" src="https://github.com/user-attachments/assets/8a2a6ac9-b3a8-4bc1-a034-f20247321440" />

|                        Logan(로건)                         |                         Tony(토니)                         |                      Andrew(앤드류)                       |                        Lisey(리시)                        |                        Kuma(쿠마)                         |
| :--------------------------------------------------------: | :--------------------------------------------------------: | :-------------------------------------------------------: | :-------------------------------------------------------: | :-------------------------------------------------------: |
|                            ISTP                            |                            INFP                            |                           ISTP                            |                           ISTJ                            |                           ESTJ                            |
|          [@KimDwDev](https://github.com/KimDwDev)          |         [@seorang42](https://github.com/seorang42)         |         [@tjsdn052](https://github.com/tjsdn052)          |         [@chamny20](https://github.com/chamny20)          |         [@ChaJiTae](https://github.com/ChaJiTae)          |
| ![](https://avatars.githubusercontent.com/u/212347248?v=4) | ![](https://avatars.githubusercontent.com/u/123955813?v=4) | ![](https://avatars.githubusercontent.com/u/74086324?v=4) | ![](https://avatars.githubusercontent.com/u/80542421?v=4) | ![](https://avatars.githubusercontent.com/u/55056889?v=4) |
|                          준비됐엉️                          |                     마지막까지 즐겁게                      |                        일단 해보기                        |                   다 경험이고 추억이다                    |                          크아앙                           |

<br/>
