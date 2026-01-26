# [Stage 1: Build]
FROM node:24.13.0-alpine AS build
WORKDIR /app

# 1. 주입받을 변수들 선언
ARG VITE_API_URL
ARG BUILD_CMD=build  # <-- [추가] 젠킨스가 build:dev를 보내줄 구멍입니다!

ENV VITE_API_URL=$VITE_API_URL
ENV BUILD_CMD=$BUILD_CMD

# 2. 패키지 설치
COPY package*.json ./
RUN npm install

# 3. 소스 코드 복사 및 빌드
COPY . .

# [핵심 수정] 하드코딩된 build 대신 변수를 사용합니다.
# 젠킨스가 'build:dev'를 보내면 'npm run build:dev'가 실행됩니다!
RUN npm run ${BUILD_CMD}

# [Stage 2: Run]
FROM nginx:stable-alpine

# 4. 빌드 결과물(dist)을 Nginx로 복사
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]