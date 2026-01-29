pipeline {
    agent any
    tools { jdk 'jdk17' }

    environment {
        NET_DEV = 'dev-net'
        IMG_BACK = 'my-backend'
        PROFILE = 'dev'
        MM_URL = 'https://meeting.ssafy.com/hooks/3xiyay1rgpygiqgcbh8t9iqnnh'
        // 포테이너 및 젠킨스 로그 주소 (팀 환경에 맞게 수정)
        PORTAINER_URL = 'https://i14e104.p.ssafy.io/portainer/#!/1/docker/containers'
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
                        // 정보 추출
                        def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                        def commitMsg = sh(script: "git log -1 --pretty=format:'%s'", returnStdout: true).trim()
                        def branchName = env.BRANCH_NAME ?: "unknown"

                        // [START] 배포 시작 알림 (고급형)
                        def startMsg = """
### 🚀 배포 프로세스 시작
---
* **구분**: `Backend-Dev`
* **브랜치**: `${branchName}`
* **작업자**: `${buildUser}`
* **메시지**: `${commitMsg}`
* **상태**: `빌드 완료 후 컨테이너 교체 진행 중...`
---
"""
                        sendMM(startMsg, "#FFD700") // 금색(Gold)

                        // 배포 로직 시작
                        sh "docker build -t ${IMG_BACK}:latest ."
                        def confFile = "service-url-dev.inc"
                        def currentUrl = sh(script: "docker exec main-nginx cat /etc/nginx/conf.d/${confFile} || echo 'blue'", returnStdout: true).trim()
                        def targetColor = currentUrl.contains("blue") ? "green" : "blue"
                        def targetName = "dev-backend-${targetColor}"
                        def targetPort = (targetColor == "blue" ? "8081" : "8082")

                        sh "docker rm -f ${targetName} || true"
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

                        // 검증
                        def isBooted = false
                        for(int i=0; i<15; i++) {
                            sleep 3
                            try {
                                def status = sh(script: "curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://${targetName}:8080/", returnStdout: true).trim()
                                if (status.isInteger() && [200, 401, 404].contains(status.toInteger())) {
                                    isBooted = true; break
                                }
                            } catch (e) { echo "부팅 대기..." }
                        }
                        if (!isBooted) error("서버 부팅 검증 실패")

                        // 스위칭
                        sh "echo 'set \$service_url http://${targetName}:8080;' > switch.tmp"
                        sh "docker cp switch.tmp main-nginx:/etc/nginx/conf.d/${confFile}"
                        sh "docker exec main-nginx nginx -s reload"

                        sleep 10
                        sh "docker rm -f dev-backend-${currentUrl.contains('blue') ? 'blue' : 'green'} || true"
                    }
                }
            }
        }
    }

    post {
        always {
            script { sh "docker image prune -f" }
        }
        success {
            script {
                def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                def branchName = env.BRANCH_NAME ?: "unknown"
                
                def msg = """
### ✅ 배포 완료
---
* **대상**: `Backend-Dev`
* **브랜치**: `${branchName}`
* **배포자**: `${buildUser}`
* **결과**: `무중단 전환 성공 (Blue/Green)`
---
> [🛠 포테이너 확인](${PORTAINER_URL}) | [🔗 서비스 접속](https://i14e104.p.ssafy.io/)
"""
                sendMM(msg, "#228B22") // Forest Green
            }
        }
        failure {
            script {
                def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                def branchName = env.BRANCH_NAME ?: "unknown"

                def msg = """
### 🚨 배포 실패
---
* **대상**: `Backend-Dev`
* **브랜치**: `${branchName}`
* **담당자**: `${buildUser}`
* **상태**: `에러 발생 (자동 롤백 유지)`
---
**❗ 즉시 젠킨스 빌드 로그를 확인해 주세요.**
[👉 젠킨스 빌드 결과 보러가기](${env.BUILD_URL})
"""
                sendMM(msg, "#DC143C") // Crimson Red
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