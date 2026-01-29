pipeline {
    agent any
    tools { jdk 'jdk17' }

    environment {
        NET_DEV = 'dev-net' 
        IMG_BACK = 'my-backend'
        PROFILE = 'dev'
        COMPOSE_PATH = '/home/ubuntu/app/dev'
        // 승엽님이 만드신 그 웹훅 주소!
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
                        echo ">>> [Deploy] 무중단 배포 시작..."
                        sh "docker build -t ${IMG_BACK}:latest ."

                        def confFile = "service-url-dev.inc"
                        def currentUrl = sh(script: "docker exec main-nginx cat /etc/nginx/conf.d/${confFile} || echo 'blue'", returnStdout: true).trim()
                        def targetColor = currentUrl.contains("blue") ? "green" : "blue"
                        def targetName = "dev-backend-${targetColor}"

                        // ★ 승엽님이 만든 설계도(yml)로 배포!
                        sh "docker compose -f ${COMPOSE_PATH}/docker-compose.${targetColor}.yml up -d"

                        // [승엽님의 1차/2차 검증 로직 그대로 사용]
                        // ... (생략하지만 실제 파일엔 다 들어있음) ...

                        // Nginx 스위칭
                        sh "echo 'set \$service_url http://${targetName}:8080;' > switch.tmp"
                        sh "docker cp switch.tmp main-nginx:/etc/nginx/conf.d/${confFile}"
                        sh "docker exec main-nginx nginx -s reload"

                        sleep 10
                        sh "docker compose -f ${COMPOSE_PATH}/docker-compose.${currentUrl.contains('blue') ? 'blue' : 'green'}.yml down || true"
                    }
                }
            }
        }
    }

    post {
        always {
            script { sh "docker image prune -f" } // 요리 후 설거지!
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
                def msg = "🚨 **배포 실패 (Dev)**\n- **담당자**: `${buildUser}`\n- **상태**: 빌드/검증 에러\n- 젠킨스 로그를 확인하세요!"
                sendMM(msg, "#FF0000")
            }
        }
    }
}

def sendMM(message, color) {
    sh "curl -i -X POST -H 'Content-Type: application/json' -d '{\"attachments\": [{\"color\": \"${color}\", \"text\": \"${message}\"}]}' ${MM_URL}"
}