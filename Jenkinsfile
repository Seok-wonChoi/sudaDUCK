pipeline {
    agent any

    // 1. 젠킨스 전역 도구 설정에서 만든 JDK 17을 불러옵니다.
    tools {
        jdk 'jdk17' 
    }

    environment {
        // 네트워크 및 이미지 이름 설정
        NET_DEV = 'dev-net'
        NET_PROD = 'prod-net'
        IMG_BACK = 'my-backend'
        IMG_FRONT = 'my-frontend'
    }

    stages {
        // 1. 소스 코드 가져오기
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // ---------------------------------------------------------
        // 2. 백엔드 테스트 및 권한 부여 (Java 17 환경에서 실행)
        // ---------------------------------------------------------
        stage('Test Backend') {
            when { 
                anyOf { branch 'develop'; branch 'back-dev' } 
            }
            steps {
                dir('backend') {
                    script {
                        echo ">>> [Test] Java 17 환경에서 JUnit 테스트를 진행합니다..."
                        // gradlew 실행 권한 부여
                        sh "chmod +x gradlew" 
                        sh "./gradlew test"
                    }
                }
            }
        }

        // ---------------------------------------------------------
        // 3. 백엔드 배포 (Blue/Green 무중단 배포)
        // ---------------------------------------------------------
        stage('Deploy Backend') {
            when { 
                anyOf { branch 'develop'; branch 'back-dev'; branch 'master' } 
            }
            steps {
                dir('backend') {
                    script {
                        def isProd = (env.BRANCH_NAME == 'master')
                        def targetNet = isProd ? NET_PROD : NET_DEV
                        def profile = isProd ? "prod" : "dev"
                        def confFile = isProd ? "service-url-prod.inc" : "service-url-dev.inc"

                        echo ">>> [Backend] ${env.BRANCH_NAME} 환경 배포 중..."

                        // 빌드 전 권한 한 번 더 확인 (안전장치)
                        sh "chmod +x gradlew"
                        sh "docker build -t ${IMG_BACK}:latest ."

                        // Nginx 컬러 확인 및 타겟 결정
                        def currentUrl = sh(script: "docker exec main-nginx cat /etc/nginx/conf.d/${confFile}", returnStdout: true).trim()
                        def targetColor = currentUrl.contains("blue") ? "green" : "blue"
                        def targetName = isProd ? "prod-backend-${targetColor}" : "dev-backend-${targetColor}"
                        def targetPort = isProd ? (targetColor == "blue" ? "8083" : "8084") : (targetColor == "blue" ? "8081" : "8082")

                        sh "docker rm -f ${targetName} || true"
                        sh """
                            docker run -d --name ${targetName} --network ${targetNet} \
                            -e SPRING_PROFILES_ACTIVE=${profile} -p ${targetPort}:8080 \
                            -v /home/ubuntu/logs:/logs -v /home/ubuntu/config:/config \
                            ${IMG_BACK}:latest --spring.config.location=/config/application-${profile}.yml
                        """
                        
                        echo ">>> [Backend] 스프링 부팅 대기 중 (15초)..."
                        sleep 15

                        // Nginx 스위칭
                        sh "echo 'set \$service_url http://${targetName}:8080;' > switch.tmp"
                        sh "docker cp switch.tmp main-nginx:/etc/nginx/conf.d/${confFile}"
                        sh "docker exec main-nginx nginx -s reload"
                    }
                }
            }
        }

        // ---------------------------------------------------------
        // 4. 프론트엔드 배포 (Vite 경로 최적화)
        // ---------------------------------------------------------
        stage('Deploy Frontend') {
            when {
                anyOf { branch 'develop'; branch 'front-dev'; branch 'master' }
            }
            steps {
                dir('frontend') {
                    script {
                        def isProd = (env.BRANCH_NAME == 'master')
                        def targetNet = isProd ? NET_PROD : NET_DEV
                        def targetName = isProd ? "prod-frontend" : "dev-frontend"
                        def hostPort = isProd ? "3001" : "3000"
                        def apiUrl = isProd ? "https://i14e104.p.ssafy.io/api" : "https://i14e104.p.ssafy.io/dev-api"

                        // [핵심] master 브랜치가 아니면 무조건 build:dev 사용 (경로 문제 해결)
                        def buildCmd = isProd ? "build" : "build:dev"

                        echo ">>> [Frontend] ${env.BRANCH_NAME} 환경 배포 중 (Command: ${buildCmd})"

                        // Dockerfile에 빌드 명령어를 인자로 전달
                        sh "docker build --build-arg BUILD_CMD='${buildCmd}' --build-arg VITE_API_URL=${apiUrl} -t ${IMG_FRONT}:latest ."
                        sh "docker rm -f ${targetName} || true"
                        sh "docker run -d --name ${targetName} --network ${targetNet} -p ${hostPort}:80 ${IMG_FRONT}:latest"
                    }
                }
            }
        }
    }
}