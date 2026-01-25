# [Stage 1: Build]
FROM node:24.13.0-alpine AS build
WORKDIR /app

# 1. 주입받을 변수 선언 (상남자식 구멍 뚫기)
ARG VITE_API_URL
# 선언한 ARG를 환경 변수로 등록해야 빌드 시점에 코드가 읽을 수 있습니다.
ENV VITE_API_URL=$VITE_API_URL

# 2. 패키지 설치
COPY package*.json ./
RUN npm install

# 3. 소스 코드 복사 및 빌드
COPY . .
# 이 과정에서 VITE_API_URL이 코드 안에 박제됩니다.
RUN npm run build

# [Stage 2: Run]
FROM nginx:stable-alpine

# 4. 빌드 결과물(dist)을 Nginx로 복사
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]