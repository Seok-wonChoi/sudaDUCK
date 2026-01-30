pipeline {
    agent any
    tools { jdk 'jdk17' }

    environment {
        // [공통 환경변수]
        NET_PROD = 'prod-net'
        MM_URL = 'https://meeting.ssafy.com/hooks/3xiyay1rgpygiqgcbh8t9iqnnh'
        PORTAINER_URL = 'https://i14e104.p.ssafy.io/portainer/#!/1/docker/containers'
        
        // [Backend 환경변수]
        IMG_BACK = 'my-backend-prod'
        PROFILE = 'prod'
        NGINX_CONF = 'service-url-prod.inc'
        
        // [Frontend 환경변수]
        IMG_FRONT = 'my-frontend-prod'
        API_URL_FRONT = 'https://i14e104.p.ssafy.io/prod-api'
        FRONT_PATH = "/home/ubuntu/frontend" // 승엽님이 docker-compose.yml을 만들어둔 폴더
    }

    stages {
        stage('Checkout') { steps { checkout scm } }

        // =================================================================
        // [STAGE 1] BACKEND 빌드 및 무중단 배포 (Blue/Green)
        // =================================================================
        stage('Deploy Backend') {
            when { branch 'master' }
            steps {
                dir('backend') {
                    script {
                        def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                        def commitMsg = sh(script: "git log -1 --pretty=format:'%s'", returnStdout: true).trim()
                        
                        def startMsg = """
#### 🚀 [PROD] 배포 시작 (Backend)
---
* **브랜치**: `master`
* **작업자**: `${buildUser}`
* **메시지**: `${commitMsg}`
* **상태**: `Backend 무중단 배포 진행 중...`
---
"""
                        sendMM(startMsg, "#FFD700")

                        // 1. 빌드
                        sh "chmod +x gradlew"
                        sh "./gradlew clean build -x test --no-daemon -Dorg.gradle.jvmargs='-Xmx2g -XX:MaxMetaspaceSize=512m'"
                        sh "docker build -t ${IMG_BACK}:latest ."

                        // 2. 현재 색상 확인 및 타겟 설정
                        def currentUrl = sh(script: "docker exec main-nginx cat /etc/nginx/conf.d/${NGINX_CONF} || echo 'blue'", returnStdout: true).trim()
                        def targetColor = currentUrl.contains("blue") ? "green" : "blue"
                        def targetName = "prod-backend-${targetColor}"
                        def targetPort = (targetColor == "blue" ? "8083" : "8084")

                        // 3. 타겟 컨테이너 실행
                        sh "docker rm -f ${targetName} || true"
                        sh "docker run -d --name ${targetName} --network ${NET_PROD} -p ${targetPort}:8080 -v /home/ubuntu/config:/config -v /home/ubuntu/logs:/logs -e SPRING_PROFILES_ACTIVE=${PROFILE} ${IMG_BACK}:latest --spring.config.location=/config/application-${PROFILE}.yml"

                        // 4. 검증 및 스위칭
                        def isBooted = false
                        for(int i=0; i<15; i++) {
                            sleep 5
                            try {
                                def status = sh(script: "curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://${targetName}:8080/", returnStdout: true).trim()
                                if (status.isInteger() && [200, 401, 404].contains(status.toInteger())) { isBooted = true; break }
                            } catch (e) { echo "Backend 부팅 대기 중..." }
                        }
                        if (!isBooted) error("Backend 서버 부팅 검증 실패")

                        sh "echo 'set \$service_url http://${targetName}:8080;' > switch_prod.tmp"
                        sh "docker cp switch_prod.tmp main-nginx:/etc/nginx/conf.d/${NGINX_CONF}"
                        sh "docker exec main-nginx nginx -s reload"

                        // 5. 구버전 삭제
                        sleep 10
                        def oldColor = currentUrl.contains("blue") ? "blue" : "green"
                        sh "docker rm -f prod-backend-${oldColor} || true"
                    }
                }
            }
        }

        // =================================================================
        // [STAGE 2] FRONTEND 빌드 및 독립 배포 (Docker Compose)
        // =================================================================
        stage('Deploy Frontend') {
            when { branch 'master' }
            steps {
                dir('frontend') {
                    script {
                        def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                        
                        def startMsg = """
#### 🚀 [PROD] 배포 시작 (Frontend)
---
* **브랜치**: `master`
* **작업자**: `${buildUser}`
* **상태**: `Frontend 이미지 빌드 (Node 24) 및 Compose 재기동 중...`
---
"""
                        sendMM(startMsg, "#FFD700")

                        // 1. 이미지 빌드 (build:prod 파라미터 전달)
                        sh "docker build --build-arg BUILD_CMD='build:prod' --build-arg VITE_API_URL=${API_URL_FRONT} -t ${IMG_FRONT}:latest ."
                        
                        // 2. 홈 디렉토리의 docker-compose.yml을 사용하여 독립적 실행
                        dir("${FRONT_PATH}") {
                            sh "docker compose up -d --force-recreate"
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
                def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                def msg = """
#### ✅ [PROD] 통합 배포 완료
---
* **브랜치**: `master`
* **배포자**: `${buildUser}`
* **결과**: `Frontend(3001) & Backend(무중단) 모두 성공`
---
> [🛠 포테이너에서 컨테이너 확인](${PORTAINER_URL})
"""
                sendMM(msg, "#228B22")
            }
        }
        failure {
            script {
                def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                def msg = """
#### 🚨 [PROD] 통합 배포 실패
---
* **브랜치**: `master`
* **담당자**: `${buildUser}`
* **상태**: `배포 과정 중 에러 발생`
---
> [🔍 젠킨스 빌드 로그 확인](${env.BUILD_URL}console)
"""
                sendMM(msg, "#DC143C")
            }
        }
    }
}

def sendMM(message, color) {
    sh """
        curl -i -X POST -H 'Content-Type: application/json' \
        -d '{"attachments": [{"color": "${color}", "text": "${message}"}]}' ${MM_URL}
    """
}