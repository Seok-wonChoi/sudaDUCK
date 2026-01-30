FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# 1. 라이브러리 설치 (캐시 최적화)
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
RUN chmod +x ./gradlew
RUN ./gradlew dependencies --no-daemon

# 2. 소스코드 빌드
COPY src src
RUN ./gradlew clean bootJar -x test --no-daemon

# 3. 실행 스테이지
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE}", "app.jar"]