
pipeline {
    agent any

    tools {
        jdk 'jdk17' 
    }

    environment {
        // front-dev는 개발용 네트워크와 이미지를 사용합니다.
        NET_DEV = 'dev-net'
        IMG_FRONT = 'my-frontend'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // 백엔드 빌드 쿨하게 스킵
        stage('Skip Backend') {
            steps {
                echo ">>> [Skip] front-dev 브랜치이므로 프론트엔드만 배포합니다."
            }
        }

        stage('Deploy Frontend') {
            // front-dev 브랜치일 때만 실행
            when { branch 'front-dev' }
            steps {
                dir('frontend') {
                    script {
                        echo ">>> [Frontend] front-dev 배포 시작..."

                        def targetName = "dev-frontend"
                        def hostPort = "3000"
                        // 개발용 백엔드 API 주소 연결
                        def apiUrl = "https://i14e104.p.ssafy.io/dev-api"
                        // 아까 1단계에서 추가한 스크립트 실행
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
}