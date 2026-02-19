pipeline {
    agent any
    tools { jdk 'jdk17' }

    environment {
        // [Prod 공통]
        NET_PROD = 'prod-net'
        MM_URL = 'https://meeting.ssafy.com/hooks/3xiyay1rgpygiqgcbh8t9iqnnh'
        PORTAINER_URL = 'https://i14e104.p.ssafy.io/portainer/#!/1/docker/containers'
        
        // Jenkins 기본 환경변수 활용 (BUILD_URL 등)
        
        // [Backend - Blue/Green]
        IMG_BACK = 'my-backend-prod'
        PROFILE = 'prod'
        NGINX_CONF = 'service-url-prod.inc'
        
        // [Frontend - Direct Run]
        IMG_FRONT = 'my-frontend-prod'
        API_URL_FRONT = 'https://i14e104.p.ssafy.io/prod-api'
    }

    stages {
        stage('Initialize & Notification') {
            steps {
                script {
                    // Git 정보 추출 (작업자, 커밋해시, 메시지)
                    env.GIT_AUTHOR = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                    env.GIT_HASH = sh(script: "git log -1 --pretty=format:'%h'", returnStdout: true).trim()
                    env.GIT_MSG = sh(script: "git log -1 --pretty=format:'%s'", returnStdout: true).trim()
                    
                    // 배포 시작 알림 (파란색: 진행 중)
                    sendMM("Started", "#3a87ad", "배포 파이프라인이 시작되었습니다.")
                }
            }
        }

        stage('Checkout') {
            steps { checkout scm }
        }

        // =================================================================
        // [STAGE 1] BACKEND
        // =================================================================
        stage('Deploy Backend') {
            when { branch 'master' }
            steps {
                dir('backend') {
                    script {
                        try {
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
                        } catch (e) {
                            error "Backend Deployment Failed: ${e.message}"
                        }
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
                        try {
                            sh "docker rm -f prod-frontend || true"
                            sh "docker build --build-arg BUILD_CMD='build:prod' --build-arg VITE_API_BASE_URL=${API_URL_FRONT} -t ${IMG_FRONT}:latest ."
                            sh """
                                docker run -d \
                                --name prod-frontend \
                                --network ${NET_PROD} \
                                -p 3001:80 \
                                --restart always \
                                ${IMG_FRONT}:latest
                            """
                        } catch (e) {
                            error "Frontend Deployment Failed: ${e.message}"
                        }
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
            script {
                // 배포 성공 알림 (초록색)
                sendMM("Success", "#2ecc71", "모든 서비스가 정상적으로 배포되었습니다.")
            }
        }
        failure {
            script {
                // 배포 실패 알림 (빨간색)
                sendMM("Failure", "#e74c3c", "배포 중 오류가 발생했습니다. 로그를 확인해주세요.")
            }
        }
    }
}

// =================================================================
// [Helper] Mattermost Notification Function (Professional)
// =================================================================
def sendMM(status, color, message) {
    def payload = """
    {
        "attachments": [
            {
                "color": "${color}",
                "pretext": "#### [PROD] Deployment Notification - Build #${env.BUILD_NUMBER}",
                "title": "${status}",
                "text": "${message}",
                "fields": [
                    {
                        "short": true,
                        "title": "Branch",
                        "value": "${env.BRANCH_NAME}"
                    },
                    {
                        "short": true,
                        "title": "Author",
                        "value": "${env.GIT_AUTHOR}"
                    },
                    {
                        "short": false,
                        "title": "Commit Message",
                        "value": "${env.GIT_MSG} (${env.GIT_HASH})"
                    }
                ],
                "actions": [
                    {
                        "name": "View Console Log",
                        "integration": {
                            "url": "${env.BUILD_URL}console",
                            "context": {
                                "action": "view_log"
                            }
                        }
                    },
                    {
                        "name": "Manage Containers",
                        "integration": {
                            "url": "${PORTAINER_URL}",
                            "context": {
                                "action": "view_portainer"
                            }
                        }
                    }
                ]
            }
        ]
    }
    """

    // curl 명령어로 전송 (Payload 포맷팅 주의)
    sh "curl -i -X POST -H 'Content-Type: application/json' -d '${payload}' ${MM_URL}"
}