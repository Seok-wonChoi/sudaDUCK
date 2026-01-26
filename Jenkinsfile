pipeline {
    agent any

    environment {
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

        // [추가] 2. 백엔드 테스트 스테이지 (품질 검사)
        stage('Test Backend') {
            when { 
                anyOf { branch 'develop'; branch 'backend-dev' } 
            }
            steps {
                dir('backend') {
                    // 테스트가 실패하면 배포를 중단합니다.
                    sh './gradlew test' 
                }
            }
        }

        // 3. 백엔드 빌드 & 배포
        stage('Deploy Backend') {
            // [검문소] 특정 브랜치 머지/푸시 때만 실행!
            when {
                anyOf {
                    branch 'master'
                    branch 'develop'
                    branch 'backend-dev'
                }
            }
            steps {
                dir('backend') {
                    script {
                        def isProd = (env.GIT_BRANCH?.contains('master'))
                        def targetNet = isProd ? NET_PROD : NET_DEV
                        def confFile = isProd ? "service-url-prod.inc" : "service-url-dev.inc"
                        def profile = isProd ? "prod" : "dev"

                        // 빌드 시 테스트는 위 스테이지에서 했으니 여기선 제외(-x test)
                        sh "docker build -t ${IMG_BACK}:latest ."

                        def currentUrl = sh(script: "docker exec main-nginx cat /etc/nginx/conf.d/${confFile}", returnStdout: true).trim()
                        def targetColor = currentUrl.contains("blue") ? "green" : "blue"
                        def targetName = isProd ? "prod-backend-${targetColor}" : "dev-backend-${targetColor}"

                        def targetPort = isProd ? (targetColor == "blue" ? "8083" : "8084") : (targetColor == "blue" ? "8081" : "8082")

                        echo ">>> [Backend] ${targetName} 배포 시작"

                        sh "docker rm -f ${targetName} || true"
                        sh """
                            docker run -d --name ${targetName} --network ${targetNet} \
                            -e SPRING_PROFILES_ACTIVE=${profile} -p ${targetPort}:8080 \
                            -v /home/ubuntu/logs:/logs -v /home/ubuntu/config:/config \
                            ${IMG_BACK}:latest --spring.config.location=/config/application-${profile}.yml
                        """
                        sleep 15
                        sh "echo 'set \$service_url http://${targetName}:8080;' > switch.tmp"
                        sh "docker cp switch.tmp main-nginx:/etc/nginx/conf.d/${confFile}"
                        sh "docker exec main-nginx nginx -s reload"
                    }
                }
            }
        }

        // 4. 프론트엔드 빌드 & 배포
        stage('Deploy Frontend') {
            // [검문소] 프론트 관련 브랜치만 통과!
            when {
                anyOf {
                    branch 'master'
                    branch 'develop'
                    branch 'front-dev'
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

                        // [핵심] 아까 package.json에 만든 명령어를 선택적으로 사용!
                        def buildCmd = isProd ? "build" : "build:dev"

                        echo ">>> [Frontend] 빌드 모드: ${buildCmd} (API: ${apiUrl})"

                        // Docker build 시점에 명령어를 주입합니다.
                        sh "docker build --build-arg BUILD_CMD='${buildCmd}' --build-arg VITE_API_URL=${apiUrl} -t ${IMG_FRONT}:latest ."

                        sh "docker rm -f ${targetName} || true"
                        sh "docker run -d --name ${targetName} --network ${targetNet} -p ${hostPort}:80 ${IMG_FRONT}:latest"
                    }
                }
            }
        }
    }
}