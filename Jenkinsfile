pipeline {
    agent any
    tools { jdk 'jdk17' }

    environment {
        NET_DEV = 'dev-net'
        IMG_FRONT = 'my-frontend'
        MM_URL = 'https://meeting.ssafy.com/hooks/3xiyay1rgpygiqgcbh8t9iqnnh'
        PORTAINER_URL = 'https://i14e104.p.ssafy.io/portainer/#!/1/docker/containers'
    }

    stages {
        stage('Checkout') { steps { checkout scm } }

        stage('Skip Backend') {
            steps { echo ">>> [Skip] front-dev 브랜치이므로 프론트엔드만 배포합니다." }
        }

        stage('Deploy Frontend') {
            when { branch 'front-dev' }
            steps {
                dir('frontend') {
                    script {
                        // 정보 추출
                        def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                        def commitMsg = sh(script: "git log -1 --pretty=format:'%s'", returnStdout: true).trim()
                        def branchName = env.BRANCH_NAME ?: "unknown"

                        // #### 배포 시작 알림 (글자 크기 축소)
                        def startMsg = """
#### 🚀 배포 시작
---
* **브랜치**: `${branchName}`
* **작업자**: `${buildUser}`
* **메시지**: `${commitMsg}`
* **상태**: `Frontend 빌드 및 컨테이너 교체 중...`
---
"""
                        sendMM(startMsg, "#FFD700")

                        def targetName = "dev-frontend"
                        def hostPort = "3000"
                        def apiUrl = "https://i14e104.p.ssafy.io/dev-api"
                        def buildCmd = "build:dev" 

                        // 도커 빌드 및 배포
                        sh "docker build --build-arg BUILD_CMD='${buildCmd}' --build-arg VITE_API_URL=${apiUrl} -t ${IMG_FRONT}:latest ."
                        sh "docker rm -f ${targetName} || true"
                        sh "docker run -d --name ${targetName} --network ${NET_DEV} -p ${hostPort}:80 ${IMG_FRONT}:latest"
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                echo ">>> [Cleanup] 프론트엔드 유령 이미지 청소"
                sh "docker image prune -f"
            }
        }
        success {
            script {
                def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                def branchName = env.BRANCH_NAME ?: "unknown"
                def msg = """
#### ✅ 배포 완료
---
* **브랜치**: `${branchName}`
* **배포자**: `${buildUser}`
* **결과**: `Frontend 배포 성공`
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
                def msg = """
#### 🚨 배포 실패
---
* **브랜치**: `${branchName}`
* **담당자**: `${buildUser}`
* **상태**: `Frontend 배포 에러 발생`
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