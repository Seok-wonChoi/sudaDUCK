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

        // ---------------------------------------------------------
        // 2. 백엔드 배포 (대상: develop, back-dev, master)
        // ---------------------------------------------------------
        stage('Deploy Backend') {
            when { 
                // [수정] 멀티브랜치에서는 branch 문법이 100% 정확하게 작동합니다.
                anyOf { branch 'develop'; branch 'back-dev'; branch 'master' } 
            }
            steps {
                dir('backend') {
                    script {
                        // [수정] env.BRANCH_NAME을 사용하면 'origin/' 없이 이름만 깔끔하게 옵니다.
                        def isProd = (env.BRANCH_NAME == 'master')
                        def targetNet = isProd ? NET_PROD : NET_DEV
                        def profile = isProd ? "prod" : "dev"
                        def confFile = isProd ? "service-url-prod.inc" : "service-url-dev.inc"

                        echo ">>> [Backend] ${env.BRANCH_NAME} 환경 배포 중..."

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
                        
                        sleep 15
                        sh "echo 'set \$service_url http://${targetName}:8080;' > switch.tmp"
                        sh "docker cp switch.tmp main-nginx:/etc/nginx/conf.d/${confFile}"
                        sh "docker exec main-nginx nginx -s reload"
                    }
                }
            }
        }

        // ---------------------------------------------------------
        // 3. 프론트엔드 배포 (대상: develop, front-dev, master)
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

                        // [핵심] master 브랜치가 아니면 무조건 build:dev 사용
                        def buildCmd = isProd ? "build" : "build:dev"

                        echo ">>> [Frontend] ${env.BRANCH_NAME} 환경 배포 중 (Command: ${buildCmd})"

                        sh "docker build --build-arg BUILD_CMD='${buildCmd}' --build-arg VITE_API_URL=${apiUrl} -t ${IMG_FRONT}:latest ."
                        sh "docker rm -f ${targetName} || true"
                        sh "docker run -d --name ${targetName} --network ${targetNet} -p ${hostPort}:80 ${IMG_FRONT}:latest"
                    }
                }
            }
        }
    }
}