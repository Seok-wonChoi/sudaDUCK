pipeline {
    agent any
    tools { jdk 'jdk17' }

    environment {
        // [Dev 환경변수]
        NET_DEV = 'dev-net'
        IMG_FRONT = 'my-frontend'  // dev용 이미지 이름
        
        // [API 주소 - Dev]
        API_URL_FRONT = 'https://i14e104.p.ssafy.io/dev-api'
        
        // [알림 설정]
        MM_URL = 'https://meeting.ssafy.com/hooks/3xiyay1rgpygiqgcbh8t9iqnnh'
        PORTAINER_URL = 'https://i14e104.p.ssafy.io/portainer/#!/1/docker/containers'
    }

    stages {
        stage('Checkout') { steps { checkout scm } }

        // Dev 브랜치에서는 백엔드 배포 건너뜀
        stage('Skip Backend') {
            steps { echo ">>> [Skip] front-dev 브랜치이므로 프론트엔드만 배포합니다." }
        }

        // =================================================================
        // [STAGE] FRONTEND - Dev 배포 (Docker Run 직접 실행)
        // =================================================================
        stage('Deploy Frontend') {
            when { branch 'front-dev' }
            steps {
                dir('frontend') {
                    script {
                        def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                        
                        def startMsg = """
#### 🚀 [DEV] 배포 시작 (Frontend)
---
* **브랜치**: `front-dev`
* **작업자**: `${buildUser}`
* **상태**: `Docker Run으로 직접 배포 중... (포트 3000)`
---
"""
                        sendMM(startMsg, "#FFD700")

                        // 1. 이미지 빌드 (build:dev 사용 + Dev API 주소 주입)
                        sh "docker build --build-arg BUILD_CMD='build:dev' --build-arg VITE_API_URL=${API_URL_FRONT} -t ${IMG_FRONT}:latest ."
                        
                        // 2. 기존 컨테이너 삭제 (이름: dev-frontend)
                        sh "docker rm -f dev-frontend || true"

                        // 3. 새 컨테이너 실행 (docker-compose 없이 직접 실행)
                        // - 포트: 3000:80 (Dev는 3000번)
                        // - 네트워크: dev-net
                        sh """
                            docker run -d \
                            --name dev-frontend \
                            --network ${NET_DEV} \
                            -p 3000:80 \
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
            }
        }
        success {
            script {
                def buildUser = sh(script: "git log -1 --pretty=format:'%an'", returnStdout: true).trim()
                def msg = """
#### ✅ [DEV] 배포 완료
---
* **브랜치**: `front-dev`
* **배포자**: `${buildUser}`
* **결과**: `Frontend(3000) 배포 성공`
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
#### 🚨 [DEV] 배포 실패
---
* **브랜치**: `front-dev`
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