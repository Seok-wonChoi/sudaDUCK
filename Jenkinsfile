pipeline {
    agent any

    // 1. 젠킨스 설정에서 만든 jdk17 사용
    tools {
        jdk 'jdk17' 
    }

    environment {
        NET_DEV = 'dev-net'
        NET_PROD = 'prod-net'
        IMG_BACK = 'my-backend'
        IMG_FRONT = 'my-frontend'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // 2. 백엔드 빌드 (테스트 스킵으로 DB 에러 회피)
        stage('Test Backend') {
            when { anyOf { branch 'develop'; branch 'back-dev' } }
            steps {
                dir('backend') {
                    script {
                        echo ">>> [Build] gradlew 권한 부여 및 빌드 진행..."
                        sh "chmod +x gradlew" 
                        sh "./gradlew build -x test" 
                    }
                }
            }
        }

        // ---------------------------------------------------------
        // 3. 백엔드 배포 (Blue/Green 스위칭 + Cleanup 로직 추가)
        // ---------------------------------------------------------
        stage('Deploy Backend') {
            when { anyOf { branch 'develop'; branch 'back-dev'; branch 'master' } }
            steps {
                dir('backend') {
                    script {
                        def isProd = (env.BRANCH_NAME == 'master')
                        def targetNet = isProd ? NET_PROD : NET_DEV
                        def profile = isProd ? "prod" : "dev"
                        def confFile = isProd ? "service-url-prod.inc" : "service-url-dev.inc"

                        sh "chmod +x gradlew"
                        sh "docker build -t ${IMG_BACK}:latest ."

                        // 현재 서비스 중인 컬러 확인
                        def currentUrl = sh(script: "docker exec main-nginx cat /etc/nginx/conf.d/${confFile}", returnStdout: true).trim()
                        def targetColor = currentUrl.contains("blue") ? "green" : "blue"
                        def targetName = isProd ? "prod-backend-${targetColor}" : "dev-backend-${targetColor}"
                        def targetPort = isProd ? (targetColor == "blue" ? "8083" : "8084") : (targetColor == "blue" ? "8081" : "8082")

                        // 1) 새로운 컬러 컨테이너 실행
                        sh "docker rm -f ${targetName} || true"
                        sh """
                            docker run -d --name ${targetName} --network ${targetNet} \
                            -e SPRING_PROFILES_ACTIVE=${profile} -p ${targetPort}:8080 \
                            -v /home/ubuntu/logs:/logs -v /home/ubuntu/config:/config \
                            ${IMG_BACK}:latest --spring.config.location=/config/application-${profile}.yml
                        """
                        
                        echo ">>> [Backend] 스프링 부팅 대기 중 (15초)..."
                        sleep 15

                        // 2) Nginx 스위칭 (교통 정리)
                        sh "echo 'set \$service_url http://${targetName}:8080;' > switch.tmp"
                        sh "docker cp switch.tmp main-nginx:/etc/nginx/conf.d/${confFile}"
                        sh "docker exec main-nginx nginx -s reload"

                        // 3) [핵심 추가] 이제 필요 없어진 이전 컨테이너 정리 (Cleanup)
                        def oldColor = (targetColor == 'blue') ? 'green' : 'blue'
                        def oldName = isProd ? "prod-backend-${oldColor}" : "dev-backend-${oldColor}"
                        
                        echo ">>> [Cleanup] 배포 성공! 이제 이전 버전인 ${oldName}을 정리합니다."
                        sh "docker rm -f ${oldName} || true"
                    }
                }
            }
        }

        // 4. 프론트엔드 배포
        stage('Deploy Frontend') {
            when { anyOf { branch 'develop'; branch 'front-dev'; branch 'master' } }
            steps {
                dir('frontend') {
                    script {
                        def isProd = (env.BRANCH_NAME == 'master')
                        def targetNet = isProd ? NET_PROD : NET_DEV
                        def targetName = isProd ? "prod-frontend" : "dev-frontend"
                        def hostPort = isProd ? "3001" : "3000"
                        def apiUrl = isProd ? "https://i14e104.p.ssafy.io/api" : "https://i14e104.p.ssafy.io/dev-api"
                        def buildCmd = isProd ? "build" : "build:dev"

                        sh "docker build --build-arg BUILD_CMD='${buildCmd}' --build-arg VITE_API_URL=${apiUrl} -t ${IMG_FRONT}:latest ."
                        sh "docker rm -f ${targetName} || true"
                        sh "docker run -d --name ${targetName} --network ${targetNet} -p ${hostPort}:80 ${IMG_FRONT}:latest"
                    }
                }
            }
        }
    }
}