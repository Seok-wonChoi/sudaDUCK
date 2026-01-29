pipeline {
    agent any
    tools { jdk 'jdk17' }

    environment {
        NET_DEV = 'dev-net'
        IMG_BACK = 'my-backend'
        PROFILE = 'dev'
        MM_URL = 'https://meeting.ssafy.com/hooks/3xiyay1rgpygiqgcbh8t9iqnnh'
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
                        def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                        def commitMsg = sh(script: "git log -1 --pretty=format:'%s'", returnStdout: true).trim()
                        def branchName = env.BRANCH_NAME ?: "unknown"

                        // [START] 배포 시작 알림 (글자 크기 축소 및 대상 삭제)
                        def startMsg = """
#### 🚀 배포 시작
---
* **브랜치**: `${branchName}`
* **작업자**: `${buildUser}`
* **메시지**: `${commitMsg}`
* **상태**: `진행 중...`
---
"""
                        sendMM(startMsg, "#FFD700")

                        // 배포 로직 (기존과 동일)
                        sh "docker build -t ${IMG_BACK}:latest ."
                        def confFile = "service-url-dev.inc"
                        def currentUrl = sh(script: "docker exec main-nginx cat /etc/nginx/conf.d/${confFile} || echo 'blue'", returnStdout: true).trim()
                        def targetColor = currentUrl.contains("blue") ? "green" : "blue"
                        def targetName = "dev-backend-${targetColor}"
                        def targetPort = (targetColor == "blue" ? "8081" : "8082")

                        sh "docker rm -f ${targetName} || true"
                        sh "docker run -d --name ${targetName} --network ${NET_DEV} -p ${targetPort}:8080 -v /home/ubuntu/config:/config -v /home/ubuntu/logs:/logs -e SPRING_PROFILES_ACTIVE=${PROFILE} ${IMG_BACK}:latest --spring.config.location=/config/application-${PROFILE}.yml"

                        // 검증 및 스위칭
                        def isBooted = false
                        for(int i=0; i<15; i++) {
                            sleep 3
                            try {
                                def status = sh(script: "curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://${targetName}:8080/", returnStdout: true).trim()
                                if (status.isInteger() && [200, 401, 404].contains(status.toInteger())) { isBooted = true; break }
                            } catch (e) { echo "부팅 대기..." }
                        }
                        if (!isBooted) error("서버 부팅 검증 실패")

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
                
                // [SUCCESS] 서비스 접속 링크 삭제 및 포테이너만 유지
                def msg = """
#### ✅ 배포 완료
---
* **브랜치**: `${branchName}`
* **배포자**: `${buildUser}`
* **결과**: `무중단 전환 성공`
---
> [🛠 포테이너에서 컨테이너 확인](${PORTAINER_URL})
"""
                sendMM(msg, "#228B22")
            }
        }
        failure {
            script {
                def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                def branchName = env.BRANCH_NAME ?: "unknown"

                // [FAILURE] 젠킨스 로그 링크만 유지
                def msg = """
#### 🚨 배포 실패
---
* **브랜치**: `${branchName}`
* **담당자**: `${buildUser}`
* **상태**: `에러 발생`
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