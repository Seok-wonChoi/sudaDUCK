pipeline {
    agent any

    tools {
        jdk 'jdk17'
    }

    environment {
        // [설정] 백엔드 개발 환경 변수 고정
        NET_DEV = 'dev-net'
        IMG_BACK = 'my-backend'
        PROFILE = 'dev'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // 1. 빌드 테스트 (호스트에서 미리 체크)
        stage('Build Check') {
            when { branch 'back-dev' }
            steps {
                dir('backend') {
                    script {
                        echo ">>> [Build] GitLab에 설정 파일이 없어도 -x test 덕분에 성공합니다."
                        sh "chmod +x gradlew"
                        sh "./gradlew clean build -x test"
                    }
                }
            }
        }

        // 2. 백엔드 배포 (Docker 빌드 & 실행)
        stage('Deploy Backend') {
            when { branch 'back-dev' }
            steps {
                dir('backend') {
                    script {
                        echo ">>> [Deploy] 백엔드(Dev) 배포 시작..."

                        // 1) 도커 이미지 빌드 (Multi-stage Dockerfile 사용)
                        sh "docker build -t ${IMG_BACK}:latest ."

                        // 2) 현재 실행 중인 컬러 확인 (Blue/Green)
                        def confFile = "service-url-dev.inc"
                        // 파일이 없거나 에러나면 기본값 'blue'
                        def currentUrl = sh(script: "docker exec main-nginx cat /etc/nginx/conf.d/${confFile} || echo 'blue'", returnStdout: true).trim()
                        
                        // 3) 타겟 설정 (반대 컬러 선택)
                        def targetColor = currentUrl.contains("blue") ? "green" : "blue"
                        def targetName = "dev-backend-${targetColor}"
                        def targetPort = (targetColor == "blue" ? "8081" : "8082")

                        echo ">>> [Target] 현재: ${currentUrl} -> 목표: ${targetName} (Port: ${targetPort})"

                        // 4) 기존 컨테이너 청소
                        sh "docker rm -f ${targetName} || true"

                        // 5) [핵심] EC2 설정 파일 주입하여 실행
                        sh """
                            docker run -d --name ${targetName} \
                            --network ${NET_DEV} \
                            -p ${targetPort}:8080 \
                            -v /home/ubuntu/config:/config \
                            -v /home/ubuntu/logs:/logs \
                            -e SPRING_PROFILES_ACTIVE=${PROFILE} \
                            ${IMG_BACK}:latest \
                            --spring.config.location=/config/application-${PROFILE}.yml
                        """

                        // 6) 부팅 대기
                        echo ">>> [Wait] 서버 기동 대기 (15초)..."
                        sleep 15

                        // 7) Nginx 스위칭
                        sh "echo 'set \$service_url http://${targetName}:8080;' > switch.tmp"
                        sh "docker cp switch.tmp main-nginx:/etc/nginx/conf.d/${confFile}"
                        sh "docker exec main-nginx nginx -s reload"

                        // 8) 이전 버전 정리 (Cleanup)
                        def oldColor = (targetColor == 'blue') ? 'green' : 'blue'
                        def oldName = "dev-backend-${oldColor}"
                        
                        echo ">>> [Cleanup] 이전 버전(${oldName})을 정리합니다."
                        sh "docker rm -f ${oldName} || true"
                    }
                }
            }
        }
    }
}