pipeline {
    agent any

    environment {
        // 승엽님 인프라 네트워크 이름
        NET_DEV = 'dev-net'
        NET_PROD = 'prod-net'

        // 이미지 이름 (로컬 빌드용)
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

        // 2. 백엔드 빌드 & 배포 (Blue/Green 무중단)
        stage('Deploy Backend') {
            when {
                anyOf { branch 'back-dev'; branch 'develop'; branch 'master' }
            }
            steps {
                dir('backend') { // [체크] 백엔드 코드 폴더명 확인
                    script {
                        // (1) 환경 변수 설정 (Dev vs Prod)
                        def isProd = (env.BRANCH_NAME == 'master')
                        def targetNet = isProd ? NET_PROD : NET_DEV
                        def confFile = isProd ? "service-url-prod.inc" : "service-url-dev.inc"
                        def profile = isProd ? "prod" : "dev"

                        // (2) 도커 이미지 빌드 (로컬)
                        // 승엽님 도커파일(멀티스테이지)을 이용해서 빌드
                        sh "docker build -t ${IMG_BACK}:latest ."

                        // (3) 현재 실행 중인 컬러 확인 (Nginx에게 물어봄)
                        def currentUrl = sh(script: "docker exec main-nginx cat /etc/nginx/conf.d/${confFile}", returnStdout: true).trim()

                        // (4) 타겟(반대편) 결정
                        def targetColor = currentUrl.contains("blue") ? "green" : "blue"
                        def targetName = isProd ? "prod-backend-${targetColor}" : "dev-backend-${targetColor}"

                        // 포트 설정 (Dev: 8081/8082, Prod: 8083/8084)
                        def targetPort = ""
                        if (!isProd) {
                            targetPort = (targetColor == "blue") ? "8081" : "8082"
                        } else {
                            targetPort = (targetColor == "blue") ? "8083" : "8084"
                        }

                        echo ">>> 백엔드 배포 시작: ${targetName} (Port: ${targetPort}, Profile: ${profile})"

                        // (5) 기존 타겟 컨테이너 삭제 (충돌 방지)
                        sh "docker rm -f ${targetName} || true"

                        // (6) 새 컨테이너 실행 (설정 파일 주입!)
                        // -v /home/ubuntu/config:/config : 호스트의 설정 폴더를 컨테이너 안으로 연결
                        // --spring.config.location : 스프링에게 설정 파일 위치 알려줌
                        sh """
                            docker run -d \
                            --name ${targetName} \
                            --network ${targetNet} \
                            -e SPRING_PROFILES_ACTIVE=${profile} \
                            -p ${targetPort}:8080 \
                            -v /home/ubuntu/logs:/logs \
                            -v /home/ubuntu/config:/config \
                            ${IMG_BACK}:latest \
                            --spring.config.location=/config/application-${profile}.yml
                        """

                        // (7) 헬스 체크 (15초 대기 - 스프링 부팅 시간)
                        sleep 15

                        // (8) 스위칭 (Nginx 쪽지 업데이트)
                        sh "echo 'set \$service_url http://${targetName}:8080;' > switch.tmp"
                        sh "docker cp switch.tmp main-nginx:/etc/nginx/conf.d/${confFile}"
                        sh "docker exec main-nginx nginx -s reload"

                        echo ">>> 배포 완료: ${targetName}가 활성화되었습니다."
                    }
                }
            }
        }

        // 3. 프론트엔드 빌드 & 배포 (Recreate)
        stage('Deploy Frontend') {
            when {
                anyOf { branch 'front-dev'; branch 'develop'; branch 'master' }
            }
            steps {
                dir('frontend') { // [체크] 프론트 코드 폴더명 확인
                    script {
                        // (1) 환경 설정
                        def isProd = (env.BRANCH_NAME == 'master')
                        def targetNet = isProd ? NET_PROD : NET_DEV
                        def targetName = isProd ? "prod-frontend" : "dev-frontend"

                        // 호스트 포트 (Dev: 3000, Prod: 3001)
                        def hostPort = isProd ? "3001" : "3000"

                        // 백엔드 API 주소 결정 (빌드 시점에 주입)
                        def apiUrl = isProd ? "https://i14e104.p.ssafy.io/api" : "https://i14e104.p.ssafy.io/dev-api"

                        echo ">>> 프론트 배포 시작: ${targetName} (API: ${apiUrl})"

                        // (2) 도커 이미지 빌드 (API URL 주입 필수!)
                        sh "docker build --build-arg VITE_API_URL=${apiUrl} -t ${IMG_FRONT}:latest ."

                        // (3) 기존 컨테이너 삭제 후 재생성
                        sh "docker rm -f ${targetName} || true"

                        sh """
                            docker run -d \
                            --name ${targetName} \
                            --network ${targetNet} \
                            -p ${hostPort}:80 \
                            ${IMG_FRONT}:latest
                        """
                    }
                }
            }
        }
    }
}