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

# 소스 복사 후 빌드 (테스트 생략: -x test)
COPY src src
RUN ./gradlew clean bootJar -x test --no-daemon

# 2. 실행 단계 (Runner)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# 빌드 단계에서 만든 JAR 파일만 쏙 가져오기
COPY --from=build /app/build/libs/*.jar app.jar

# [수정] 복잡하게 -D 옵션 안 써도 됩니다.
# 젠킨스에서 -e SPRING_PROFILES_ACTIVE=dev 를 넣어주면
# 스프링 부트가 알아서 그 환경 변수를 읽고 적용합니다!
ENTRYPOINT ["java", "-jar", "app.jar"]