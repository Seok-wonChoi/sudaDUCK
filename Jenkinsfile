pipeline {
    agent any

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

        // 2. 백엔드 테스트 스테이지 (품질 검사)
        stage('Test Backend') {
            when { 
                expression { 
                    return env.GIT_BRANCH?.contains('develop') || env.GIT_BRANCH?.contains('backend-dev') 
                } 
            }
            steps {
                dir('backend') {
                    echo ">>> [Test] JUnit 테스트 코드를 실행합니다..."
                    sh './gradlew test' 
                }
            }
        }

        // 3. 백엔드 빌드 & 배포 (Blue/Green)
        stage('Deploy Backend') {
            when {
                expression { 
                    return env.GIT_BRANCH?.contains('master') || 
                           env.GIT_BRANCH?.contains('develop') || 
                           env.GIT_BRANCH?.contains('backend-dev')
                }
            }
            steps {
                dir('backend') {
                    script {
                        def isProd = (env.GIT_BRANCH?.contains('master'))
                        def targetNet = isProd ? NET_PROD : NET_DEV
                        def confFile = isProd ? "service-url-prod.inc" : "service-url-dev.inc"
                        def profile = isProd ? "prod" : "dev"

                        echo ">>> [Backend] 도커 이미지 빌드 중..."
                        sh "docker build -t ${IMG_BACK}:latest ."

                        // 현재 활성화된 컬러 확인 (Nginx에게 물어봄)
                        def currentUrl = sh(script: "docker exec main-nginx cat /etc/nginx/conf.d/${confFile}", returnStdout: true).trim()
                        def targetColor = currentUrl.contains("blue") ? "green" : "blue"
                        def targetName = isProd ? "prod-backend-${targetColor}" : "dev-backend-${targetColor}"

                        // 포트 분리 (Dev: 8081/8082, Prod: 8083/8084)
                        def targetPort = isProd ? (targetColor == "blue" ? "8083" : "8084") : (targetColor == "blue" ? "8081" : "8082")

                        echo ">>> [Backend] ${targetName} 배포 시작 (Port: ${targetPort})"

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

        // 4. 프론트엔드 빌드 & 배포 (Vite 경로 최적화)
        stage('Deploy Frontend') {
            when {
                expression { 
                    return env.GIT_BRANCH?.contains('master') || 
                           env.GIT_BRANCH?.contains('develop') || 
                           env.GIT_BRANCH?.contains('front-dev')
                }
            }
            steps {
                dir('frontend') {
                    script {
                        def isProd = (env.GIT_BRANCH?.contains('master'))
                        def targetNet = isProd ? NET_PROD : NET_DEV
                        def targetName = isProd ? "prod-frontend" : "dev-frontend"
                        def hostPort = isProd ? "3001" : "3000"
                        def apiUrl = isProd ? "https://i14e104.p.ssafy.io/api" : "https://i14e104.p.ssafy.io/dev-api"

                        // [핵심] 개발 브랜치일 때만 --base=/dev/ 옵션이 들어간 build:dev 사용
                        def buildCmd = isProd ? "build" : "build:dev"

                        echo ">>> [Frontend] 빌드 모드: ${buildCmd} 실행 및 이미지 빌드"

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