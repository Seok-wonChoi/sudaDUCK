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
# Vite의 base 설정을 /dev/로 맞췄기 때문에 Nginx도 해당 경로에 파일을 둡니다.

COPY --from=build /app/dist /usr/share/nginx/html

# ★ 중요: 작성한 nginx.conf를 Nginx 설정으로 교체
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]