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
CMD ["nginx", "-g", "daemon off;"]