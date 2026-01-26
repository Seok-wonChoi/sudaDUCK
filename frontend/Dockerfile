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
CMD ["nginx", "-g", "daemon off;"]