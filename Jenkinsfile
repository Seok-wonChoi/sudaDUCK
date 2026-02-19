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
        API_URL_FRONT = 'https://i14e104.p.ssafy.io/prod-api' 
    }

    stages {
        stage('Checkout') { steps { checkout scm } }

        // =================================================================
        // [STAGE 1] BACKEND
        // =================================================================
        stage('Deploy Backend') {
            when { branch 'master' }
            steps {
                dir('backend') {
                    script {
                        def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                        // [수정] 메시지 제목과 내용 분리하여 전송
                        sendMM("🚀 [Backend] 배포 시작", "작업자: ${buildUser}\n브랜치: master", "#FFD700")

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
        // [STAGE 2] FRONTEND
        // =================================================================
        stage('Deploy Frontend') {
            when { branch 'master' }
            steps {
                dir('frontend') {
                    script {
                        def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                        // [수정] 메시지 개선
                        sendMM("🚀 [Frontend] 배포 시작", "작업자: ${buildUser}", "#FFD700")

                        // 1. 기존 컨테이너 삭제
                        sh "docker rm -f prod-frontend || true"

                        // 2. 이미지 빌드
                        sh "docker build --build-arg BUILD_CMD='build:prod' --build-arg VITE_API_BASE_URL=${API_URL_FRONT} -t ${IMG_FRONT}:latest ."
                        
                        // 3. Docker Run
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
            // [수정] 성공 메시지에 접속 링크 포함
            script { 
                sendMM("✅ [PROD] 통합 배포 완료", "Front: https://i14e104.p.ssafy.io\nBack: 무중단 배포 적용됨", "#228B22") 
            }
        }
        failure {
            // [수정] 실패 메시지 강조
            script { 
                sendMM("🚨 [PROD] 배포 실패", "Jenkins 로그를 확인해주세요.", "#DC143C") 
            }
        }
    }
}

// [수정됨] MM 메시지 전송 함수 (제목, 링크, 상세내용 지원)
def sendMM(title, message, color) {
    def buildUrl = env.BUILD_URL ?: ""
    def jobName = env.JOB_NAME ?: "Jenkins Job"
    def buildNum = env.BUILD_NUMBER ?: "0"

    // JSON 포맷을 깔끔하게 정리 (Attachment 방식 사용)
    def payload = """
    {
        "attachments": [
            {
                "color": "${color}",
                "title": "${title} (Build #${buildNum})",
                "title_link": "${buildUrl}console", 
                "text": "${message}",
                "footer": "${jobName}",
                "footer_icon": "https://jenkins.io/images/logos/jenkins/jenkins.png"
            }
        ]
    }
    """

    // curl 전송
    sh """
        curl -i -X POST -H 'Content-Type: application/json' \
        -d '${payload}' ${MM_URL}
    """
}