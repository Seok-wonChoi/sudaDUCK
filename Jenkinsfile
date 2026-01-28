pipeline {
    agent any

    tools {
        jdk 'jdk17'
    }

    environment {
        // [설정] 백엔드 개발 전용 환경 변수
        // ★ 중요: 도커 컴포즈(docker-compose.yml)에 정의된 네트워크 이름과 똑같아야 합니다.
        NET_DEV = 'dev-net'     
        IMG_BACK = 'my-backend'
        PROFILE = 'dev'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // 1. 백엔드 빌드 (16GB 서버 자원 활용)
        stage('Build Backend') {
            when { branch 'back-dev' }
            steps {
                dir('backend') {
                    script {
                        echo ">>> [Build] 테스트 없이 빌드 수행 (메모리 최적화)"
                        sh "chmod +x gradlew"
                        // 힙 메모리를 2GB로 넉넉하게 주어 빌드 속도 향상
                        sh "./gradlew clean build -x test --no-daemon -Dorg.gradle.jvmargs='-Xmx2g -XX:MaxMetaspaceSize=512m'"
                    }
                }
            }
        }

        // 2. 백엔드 배포 (Blue/Green + 무중단 로직 적용)
        stage('Deploy Backend') {
            when { branch 'back-dev' }
            steps {
                dir('backend') {
                    script {
                        echo ">>> [Deploy] 백엔드(Dev) 무중단 배포 시작..."

                        // 1) 도커 이미지 빌드
                        sh "docker build -t ${IMG_BACK}:latest ."

                        // 2) 현재 실행 중인 컬러 확인 (Blue/Green)
                        def confFile = "service-url-dev.inc"
                        // 파일이 없으면 초기 상태인 'blue'로 가정
                        def currentUrl = sh(script: "docker exec main-nginx cat /etc/nginx/conf.d/${confFile} || echo 'blue'", returnStdout: true).trim()
                        
                        // 3) 타겟 설정 (반대 컬러 선택)
                        def targetColor = currentUrl.contains("blue") ? "green" : "blue"
                        def targetName = "dev-backend-${targetColor}"
                        def targetPort = (targetColor == "blue" ? "8081" : "8082")

                        echo ">>> [Target] 현재: ${currentUrl} -> 목표: ${targetName} (Port: ${targetPort})"

                        // 4) 혹시 남아있을 타겟 컨테이너 청소 (충돌 방지)
                        sh "docker rm -f ${targetName} || true"

                        // 5) [배포] 새 컨테이너 실행
                        // ★ 핵심: --network ${NET_DEV}를 통해 젠킨스/Nginx와 같은 망에 접속
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

                        // ========================================================
                        // [Health Check] 내부망(8080)을 통한 생존 확인
                        // ========================================================
                        def isHealthy = false
                        // 15회 시도 (약 45초)
                        for(int i=0; i<15; i++) {
                            sleep 3 
                            
                            // ★ 수정됨: localhost가 아닌 컨테이너 이름(targetName)으로 내부 포트(8080) 접속
                            // 헬스 컨트롤러가 없으므로 루트(/)를 찌름 -> 401/404가 나와도 서버 뜬 걸로 인정
                            def status = sh(script: "curl -s -o /dev/null -w '%{http_code}' http://${targetName}:8080/ || echo '000'", returnStdout: true).trim()
                            
                            echo ">>> [Health Check ${i+1}/15] ${targetName} 상태 코드: ${status}"
                            
                            // 000(연결실패)나 502(게이트웨이오류)가 아니면 서버 부팅 완료로 판단
                            if(status != '000' && status != '502') { 
                                isHealthy = true
                                break 
                            }
                        }

                        // 6) 결과 처리
                        if (isHealthy) {
                            echo ">>> [Success] 서버 생존 확인! Nginx를 연결합니다."
                            
                            // Nginx 스위칭
                            sh "echo 'set \$service_url http://${targetName}:8080;' > switch.tmp"
                            sh "docker cp switch.tmp main-nginx:/etc/nginx/conf.d/${confFile}"
                            sh "docker exec main-nginx nginx -s reload"

                            // ====================================================
                            // ★ [핵심 추가] 502 에러 방지를 위한 Grace Period
                            // ====================================================
                            echo ">>> [Wait] 트래픽이 완전히 넘어갈 때까지 10초 대기 (Graceful Shutdown)..."
                            sleep 10

                            // 이전 버전 정리 (Cleanup)
                            def oldColor = (targetColor == 'blue') ? 'green' : 'blue'
                            def oldName = "dev-backend-${oldColor}"
                            echo ">>> [Cleanup] 이전 버전(${oldName})을 정리합니다."
                            sh "docker rm -f ${oldName} || true"

                        } else {
                            // 실패 시 롤백 (새로 띄운 걸 죽임)
                            echo ">>> [Fail] 서버가 뜨지 않습니다. 롤백합니다."
                            sh "docker logs --tail 50 ${targetName}"
                            sh "docker rm -f ${targetName}"
                            error("배포 실패: Health Check 통과 못함") 
                        }
                    }
                }
            }
        }
    }
}