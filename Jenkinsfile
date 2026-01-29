pipeline {
    agent any

    tools {
        jdk 'jdk17'
    }

    environment {
        NET_DEV = 'dev-net'
        IMG_BACK = 'my-backend'
        PROFILE = 'dev'
        COMPOSE_PATH = '/home/ubuntu/app/dev'
        // 승엽님이 주신 그 소중한 웹훅 URL
        MM_URL = 'https://meeting.ssafy.com/hooks/3xiyay1rgpygiqgcbh8t9iqnnh'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // 1. 빌드 단계 (16GB 최적화)
        stage('Build Backend') {
            when { branch 'back-dev' }
            steps {
                dir('backend') {
                    script {
                        echo ">>> [Build] 빌드 수행"
                        sh "chmod +x gradlew"
                        sh "./gradlew clean build -x test --no-daemon -Dorg.gradle.jvmargs='-Xmx2g -XX:MaxMetaspaceSize=512m'"
                    }
                }
            }
        }

        // 2. 배포 단계 (docker-compose 하이픈 방식 적용)
        stage('Deploy Backend') {
            when { branch 'back-dev' }
            steps {
                dir('backend') {
                    script {
                        echo ">>> [Deploy] 무중단 배포 시작..."

                        // 이미지 빌드
                        sh "docker build -t ${IMG_BACK}:latest ."

                        // 현재 가동 중인 컬러 확인
                        def confFile = "service-url-dev.inc"
                        def currentUrl = sh(script: "docker exec main-nginx cat /etc/nginx/conf.d/${confFile} || echo 'blue'", returnStdout: true).trim()
                        def targetColor = currentUrl.contains("blue") ? "green" : "blue"
                        def targetName = "dev-backend-${targetColor}"

                        echo ">>> [Target] 목표: ${targetName}"

                        // ★ [수정] docker-compose (하이픈 필수!)
                        sh "docker-compose -f ${COMPOSE_PATH}/docker-compose.${targetColor}.yml up -d"

                        // 1차 검증: 서버 부팅 확인
                        def isBooted = false
                        for(int i=0; i<15; i++) {
                            sleep 3
                            try {
                                def status = sh(script: "curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://${targetName}:8080/", returnStdout: true).trim()
                                if (status.isInteger() && [200, 401, 404].contains(status.toInteger())) {
                                    isBooted = true
                                    break
                                }
                            } catch (Exception e) { echo "부팅 대기..." }
                        }

                        if (!isBooted) error("1차 검증 실패")

                        // 2차 검증: Nginx 연결 확인
                        def isDnsReady = false
                        for(int j=0; j<20; j++) {
                            sleep 1
                            try {
                                def dnsStatus = sh(script: "docker exec main-nginx curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://${targetName}:8080/", returnStdout: true).trim()
                                if (dnsStatus.isInteger() && [200, 401, 404].contains(dnsStatus.toInteger())) {
                                    isDnsReady = true
                                    break
                                }
                            } catch (Exception e) { echo "DNS 대기..." }
                        }

                        if (!isDnsReady) error("2차 검증 실패")

                        // Nginx 스위칭
                        sh "echo 'set \$service_url http://${targetName}:8080;' > switch.tmp"
                        sh "docker cp switch.tmp main-nginx:/etc/nginx/conf.d/${confFile}"
                        sh "docker exec main-nginx nginx -s reload"

                        // 이전 버전 정리 (하이픈 필수!)
                        sleep 10
                        def oldColor = (targetColor == 'blue') ? 'green' : 'blue'
                        sh "docker-compose -f ${COMPOSE_PATH}/docker-compose.${oldColor}.yml down || true"
                    }
                }
            }
        }
    }

    // ★ 청소 및 알림 (담당자 이름 포함)
    post {
        always {
            script {
                echo ">>> [Cleanup] 이미지 설거지 완료"
                sh "docker image prune -f"
            }
        }
        success {
            script {
                def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                def msg = "✅ **배포 성공 (Dev)**\n- **담당자**: `${buildUser}`\n- **상태**: 무중단 배포 완료\n- [로그 확인](https://i14e104.p.ssafy.io/portainer/)"
                sendMM(msg, "#00FF00")
            }
        }
        failure {
            script {
                def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                def msg = "🚨 **배포 실패 (Dev)**\n- **담당자**: `${buildUser}`\n- **상태**: 빌드/검증 에러 발생\n- 젠킨스 로그를 확인하세요!"
                sendMM(msg, "#FF0000")
            }
        }
    }
}

// Mattermost 전송 함수
def sendMM(message, color) {
    sh """
        curl -i -X POST -H 'Content-Type: application/json' \
        -d '{
            "attachments": [
                {
                    "color": "${color}",
                    "text": "${message}"
                }
            ]
        }' ${MM_URL}
    """
}