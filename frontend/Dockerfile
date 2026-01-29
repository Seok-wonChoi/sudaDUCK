<<<<<<< HEAD
<<<<<<< HEAD
# [Stage 1: Build]
FROM node:24.13.0-alpine AS build
WORKDIR /app

# 1. 환경 변수 주입
ARG VITE_API_URL
ARG BUILD_CMD=build 

ENV VITE_API_URL=$VITE_API_URL
ENV BUILD_CMD=$BUILD_CMD

# 2. 의존성 설치
COPY package*.json ./
RUN npm install

# 3. 소스 복사 및 빌드
COPY . .
RUN npm run ${BUILD_CMD}

# ---------------------------------------------------------
# [Stage 2: Run]
# ---------------------------------------------------------
FROM nginx:stable-alpine

# [핵심 수정] 하얀 화면 해결을 위한 경로 맞춤
# Vite의 --base=/dev/ 옵션에 대응하기 위해 /dev 폴더를 생성하고 그 안에 파일을 넣습니다.
RUN mkdir -p /usr/share/nginx/html/dev
COPY --from=build /app/dist /usr/share/nginx/html/dev

EXPOSE 80
=======
# 1. 빌드 단계
FROM node:24.13.0-alpine AS build
WORKDIR /app

# 환경 변수 설정
ARG VITE_API_URL
ARG BUILD_CMD=build
ENV VITE_API_URL=$VITE_API_URL
ENV BUILD_CMD=$BUILD_CMD

# 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 복사 및 빌드
COPY . .
# 아까 package.json에 추가한 'build:dev'가 여기서 실행됩니다.
RUN npm run ${BUILD_CMD}

# 2. 실행 단계 (Nginx)
FROM nginx:stable-alpine

# [핵심] /dev 경로 대응을 위한 폴더 생성
RUN mkdir -p /usr/share/nginx/html/dev
COPY --from=build /app/dist /usr/share/nginx/html/dev

EXPOSE 80
>>>>>>> 64a3ae58bfcb108d628f33450292d0cbfc3633b2
=======
# 1. 빌드 단계
FROM node:24.13.0-alpine AS build
WORKDIR /app

# 환경 변수 설정
ARG VITE_API_URL
ARG BUILD_CMD=build
ENV VITE_API_URL=$VITE_API_URL
ENV BUILD_CMD=$BUILD_CMD

# 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 복사 및 빌드
COPY . .
# package.json에 정의된 빌드 명령어 실행
RUN npm run ${BUILD_CMD}

# 2. 실행 단계 (Nginx)
FROM nginx:stable-alpine

# [핵심] /dev 경로 대응을 위한 폴더 생성 및 빌드 결과물 복사
RUN mkdir -p /usr/share/nginx/html/dev
COPY --from=build /app/dist /usr/share/nginx/html/dev

# ★ 추가된 부분: 작성한 nginx.conf를 Nginx 설정 디렉토리로 복사합니다.
# 기본 설정인 default.conf를 우리가 만든 설정으로 교체하는 작업입니다.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
>>>>>>> 96b5fbac90e3127ece5db3f9905d86ea53b1d2f9
CMD ["nginx", "-g", "daemon off;"]