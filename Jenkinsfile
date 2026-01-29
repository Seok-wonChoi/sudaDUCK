pipeline {
    agent any
    tools { jdk 'jdk17' }

    environment {
        NET_DEV = 'dev-net'
        IMG_BACK = 'my-backend'
        PROFILE = 'dev'
        MM_URL = 'https://meeting.ssafy.com/hooks/3xiyay1rgpygiqgcbh8t9iqnnh'
    }

    stages {
        stage('Checkout') { steps { checkout scm } }

        stage('Build Backend') {
            when { branch 'back-dev' }
            steps {
                dir('backend') {
                    script {
                        sh "chmod +x gradlew"
                        sh "./gradlew clean build -x test --no-daemon -Dorg.gradle.jvmargs='-Xmx2g -XX:MaxMetaspaceSize=512m'"
                    }
                }
            }
        }

        stage('Deploy Backend') {
            when { branch 'back-dev' }
            steps {
                dir('backend') {
                    script {
                        // ★ [업그레이드] 상세 정보 추출
                        def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                        def commitMsg = sh(script: "git log -1 --pretty=format:'%s'", returnStdout: true).trim()
                        def branchName = env.BRANCH_NAME ?: "알 수 없는 브랜치"

                        // 배포 시작 알림 (노란색)
                        def startMsg = "🚀 **배포 시작 (Dev)**\n- **담당자**: `${buildUser}`\n- **브랜치**: `${branchName}`\n- **메시지**: `${commitMsg}`\n- **상태**: 무중단 배포 진행 중..."
                        sendMM(startMsg, "#FFFF00")

                        echo ">>> [Deploy] ${branchName} 브랜치 배포 진행 중..."
                        
                        // 1) 이미지 빌드
                        sh "docker build -t ${IMG_BACK}:latest ."

                        // 2) 현재 컬러 확인
                        def confFile = "service-url-dev.inc"
                        def currentUrl = sh(script: "docker exec main-nginx cat /etc/nginx/conf.d/${confFile} || echo 'blue'", returnStdout: true).trim()
                        def targetColor = currentUrl.contains("blue") ? "green" : "blue"
                        def targetName = "dev-backend-${targetColor}"
                        def targetPort = (targetColor == "blue" ? "8081" : "8082")

                        // 3) 기존 컨테이너 청소
                        sh "docker rm -f ${targetName} || true"

                        // 4) 새 컨테이너 실행
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

                        // 5) 검증 로직 (승엽님 원본)
                        def isBooted = false
                        for(int i=0; i<15; i++) {
                            sleep 3
                            try {
                                def status = sh(script: "curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://${targetName}:8080/", returnStdout: true).trim()
                                if (status.isInteger() && [200, 401, 404].contains(status.toInteger())) {
                                    isBooted = true; break
                                }
                            } catch (e) { echo "부팅 대기 중..." }
                        }
                        if (!isBooted) error("1차 검증 실패")

                        // 6) Nginx 스위칭
                        sh "echo 'set \$service_url http://${targetName}:8080;' > switch.tmp"
                        sh "docker cp switch.tmp main-nginx:/etc/nginx/conf.d/${confFile}"
                        sh "docker exec main-nginx nginx -s reload"

                        // 7) 이전 버전 정리
                        sleep 10
                        def oldColor = (targetColor == 'blue') ? 'green' : 'blue'
                        sh "docker rm -f dev-backend-${oldColor} || true"
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                echo ">>> [Cleanup] 이미지 설거지 중..."
                sh "docker image prune -f"
            }
        }
        success {
            script {
                def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                def branchName = env.BRANCH_NAME ?: "알 수 없는 브랜치"
                def msg = "✅ **배포 성공 (Dev)**\n- **담당자**: `${buildUser}`\n- **브랜치**: `${branchName}`\n- **상태**: 배포 완료!\n- [로그 확인](https://i14e104.p.ssafy.io/portainer/)"
                sendMM(msg, "#00FF00")
            }
        }
        failure {
            script {
                def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                def branchName = env.BRANCH_NAME ?: "알 수 없는 브랜치"
                def msg = "🚨 **배포 실패 (Dev)**\n- **담당자**: `${buildUser}`\n- **브랜치**: `${branchName}`\n- **상태**: 에러 발생 (로그 확인 요망)"
                sendMM(msg, "#FF0000")
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