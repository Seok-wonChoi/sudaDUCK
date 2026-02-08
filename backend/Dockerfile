# 1. 빌드 단계 (Builder)
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Gradle 캐시 효율을 위해 의존성 파일 먼저 복사
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# 실행 권한 부여 및 의존성 다운로드
RUN chmod +x ./gradlew
RUN ./gradlew dependencies --no-daemon

# 소스 복사 후 빌드 (테스트 생략)
COPY src src
RUN ./gradlew clean bootJar -x test --no-daemon

# ---------------------------------------------------------

# 2. 실행 단계 (Runner)
FROM eclipse-temurin:17-jre
WORKDIR /app

# [수정] libasound2 -> libasound2t64 (최신 우분투 대응)
RUN apt-get update && apt-get install -y \
    libssl-dev \
    libasound2t64 \
    libatomic1 \
    && rm -rf /var/lib/apt/lists/*

# 빌드 단계에서 만든 JAR 파일 복사
COPY --from=build /app/build/libs/*.jar app.jar

# 실행 설정
ENTRYPOINT ["java", "-jar", "app.jar"]