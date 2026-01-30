pipeline {
    agent any
    tools { jdk 'jdk17' }

    environment {
        // [Prod 공통]
        NET_PROD = 'prod-net'
        MM_URL = 'https://meeting.ssafy.com/hooks/3xiyay1rgpygiqgcbh8t9iqnnh'
        PORTAINER_URL = 'https://i14e104.p.ssafy.io/portainer/#!/1/docker/containers'
        
        // [Backend - Blue/Green 무중단]
        IMG_BACK = 'my-backend-prod'
        PROFILE = 'prod'
        NGINX_CONF = 'service-url-prod.inc'
        
        // [Frontend - Direct Run]
        IMG_FRONT = 'my-frontend-prod'
        API_URL_FRONT = 'https://i14e104.p.ssafy.io/prod-api' // ★ 운영 API 주소 확인!
    }

    stages {
        stage('Checkout') { steps { checkout scm } }

        // =================================================================
        // [STAGE 1] BACKEND (기존 무중단 배포 유지)
        // =================================================================
        stage('Deploy Backend') {
            when { branch 'master' }
            steps {
                dir('backend') {
                    script {
                        def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                        sendMM("🚀 [PROD] 백엔드 배포 시작 (작업자: ${buildUser})", "#FFD700")

                        // 1. 빌드
                        sh "chmod +x gradlew"
                        sh "./gradlew clean build -x test --no-daemon -Dorg.gradle.jvmargs='-Xmx2g -XX:MaxMetaspaceSize=512m'"
                        sh "docker build -t ${IMG_BACK}:latest ."

                        // 2. Blue/Green 배포 로직
                        def currentUrl = sh(script: "docker exec main-nginx cat /etc/nginx/conf.d/${NGINX_CONF} || echo 'blue'", returnStdout: true).trim()
                        def targetColor = currentUrl.contains("blue") ? "green" : "blue"
                        def targetName = "prod-backend-${targetColor}"
                        def targetPort = (targetColor == "blue" ? "8083" : "8084")

                        sh "docker rm -f ${targetName} || true"
                        sh "docker run -d --name ${targetName} --network ${NET_PROD} -p ${targetPort}:8080 -v /home/ubuntu/config:/config -v /home/ubuntu/logs:/logs -e SPRING_PROFILES_ACTIVE=${PROFILE} ${IMG_BACK}:latest --spring.config.location=/config/application-${PROFILE}.yml"

                        // 3. 헬스 체크 & 스위칭
                        sleep 15
                        sh "echo 'set \$service_url http://${targetName}:8080;' > switch_prod.tmp"
                        sh "docker cp switch_prod.tmp main-nginx:/etc/nginx/conf.d/${NGINX_CONF}"
                        sh "docker exec main-nginx nginx -s reload"

                        // 4. 구버전 정리
                        def oldColor = currentUrl.contains("blue") ? "blue" : "green"
                        sh "docker rm -f prod-backend-${oldColor} || true"
                    }
                }
            }
        }

        // =================================================================
        // [STAGE 2] FRONTEND (★ Docker Run 직접 실행 - 수정됨)
        // =================================================================
        stage('Deploy Frontend') {
            when { branch 'master' }
            steps {
                dir('frontend') {
                    script {
                        def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                        sendMM("🚀 [PROD] 프론트엔드 배포 시작 (작업자: ${buildUser})", "#FFD700")

                        // 1. 기존 컨테이너 강제 삭제 (이름 기준)
                        sh "docker rm -f prod-frontend || true"

                        // 2. 이미지 빌드 (API 주소 확실하게 주입)
                        // build:prod 스크립트 실행
                        sh "docker build --build-arg BUILD_CMD='build:prod' --build-arg VITE_API_BASE_URL=${API_URL_FRONT} -t ${IMG_FRONT}:latest ."
                        
                        // 3. Docker Run으로 직접 실행 (포트 3001)
                        // 볼륨 마운트(-v)를 뺐습니다. 그래야 방금 빌드한 새 파일만 씁니다.
                        sh """
                            docker run -d \
                            --name prod-frontend \
                            --network ${NET_PROD} \
                            -p 3001:80 \
                            --restart always \
                            ${IMG_FRONT}:latest
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            script { 
                sh "docker image prune -f" 
                sh "rm -f backend/switch_prod.tmp"
            }
        }
        success {
            script { sendMM("✅ [PROD] 통합 배포 완료 (Front:3001, Back:무중단)", "#228B22") }
        }
        failure {
            script { sendMM("🚨 [PROD] 배포 실패... 로그 확인 요망", "#DC143C") }
        }
    }
}

def sendMM(message, color) {
    sh """
        curl -i -X POST -H 'Content-Type: application/json' \
        -d '{"attachments": [{"color": "${color}", "text": "${message}"}]}' ${MM_URL}
    """
}