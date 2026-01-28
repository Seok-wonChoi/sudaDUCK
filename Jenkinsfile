pipeline {
    agent any

    tools {
        jdk 'jdk17'
    }

    environment {
        // [설정] 백엔드 개발 전용 환경 변수
        // ★ 중요: 도커 컴포즈 네트워크 이름과 일치해야 함
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

        // 1. 백엔드 빌드 (16GB 서버 자원 최적화)
        stage('Build Backend') {
            when { branch 'back-dev' }
            steps {
                dir('backend') {
                    script {
                        echo ">>> [Build] 테스트 없이 빌드 수행"
                        sh "chmod +x gradlew"
                        // 16GB 서버에 맞춰 힙 메모리를 2GB 할당 (-Xmx2g)
                        sh "./gradlew clean build -x test --no-daemon -Dorg.gradle.jvmargs='-Xmx2g -XX:MaxMetaspaceSize=512m'"
                    }
                }
            }
        }

        // 2. 백엔드 배포 (Blue/Green + 이중 검증 로직)
        stage('Deploy Backend') {
            when { branch 'back-dev' }
            steps {
                dir('backend') {
                    script {
                        echo ">>> [Deploy] 백엔드(Dev) 무중단 배포 시작..."

                        // 1) 도커 이미지 빌드
                        sh "docker build -t ${IMG_BACK}:latest ."

                        // 2) 현재 실행 중인 컬러 확인
                        def confFile = "service-url-dev.inc"
                        def currentUrl = sh(script: "docker exec main-nginx cat /etc/nginx/conf.d/${confFile} || echo 'blue'", returnStdout: true).trim()
                        
                        // 3) 타겟 설정 (Blue <-> Green)
                        def targetColor = currentUrl.contains("blue") ? "green" : "blue"
                        def targetName = "dev-backend-${targetColor}"
                        def targetPort = (targetColor == "blue" ? "8081" : "8082")

                        echo ">>> [Target] 현재: ${currentUrl} -> 목표: ${targetName} (Port: ${targetPort})"

                        // 4) 기존 컨테이너 청소
                        sh "docker rm -f ${targetName} || true"

                        // 5) 새 컨테이너 실행
                        // ★ --network ${NET_DEV} 필수!
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
                        // [1차 검증] 젠킨스 -> 백엔드 (서버 부팅 확인)
                        // ========================================================
                        def isBooted = false
                        for(int i=0; i<15; i++) {
                            sleep 3
                            // '|| echo 000' 제거 -> 문자열 꼬임 방지
                            // curl 실패 시 예외가 발생하므로 try-catch로 처리
                            try {
                                def status = sh(script: "curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://${targetName}:8080/", returnStdout: true).trim()
                                echo ">>> [1차: Boot Check ${i+1}/15] ${targetName} 응답: ${status}"
                                
                                // 숫자인지 확인 후, 404(페이지없음) or 401(권한없음) or 200(성공) 이면 통과
                                // 502(게이트웨이), 000(실패)는 통과 안 시킴
                                if (status.isInteger()) {
                                    def code = status.toInteger()
                                    if (code != 502 && code != 0) {
                                        isBooted = true
                                        break
                                    }
                                }
                            } catch (Exception e) {
                                echo ">>> [1차: Boot Check ${i+1}/15] 아직 연결 불가..."
                            }
                        }

                        if (!isBooted) {
                            sh "docker logs --tail 50 ${targetName}"
                            sh "docker rm -f ${targetName}"
                            error("배포 실패: 1차 검증(서버 부팅) 실패")
                        }

                        echo ">>> [Success] 서버 부팅 완료! 2차 검증(Nginx 연결)을 시작합니다."

                        // ========================================================
                        // [2차 검증] Nginx -> 백엔드 (DNS 전파 확인) - ★ 502 방지 핵심
                        // ========================================================
                        def isDnsReady = false
                        for(int j=0; j<20; j++) {
                            sleep 1
                            try {
                                // Nginx 컨테이너 안에서 curl을 쏴봅니다.
                                def dnsStatus = sh(script: "docker exec main-nginx curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://${targetName}:8080/", returnStdout: true).trim()
                                echo ">>> [2차: DNS Check ${j+1}/20] Nginx가 보는 상태: ${dnsStatus}"

                                if (dnsStatus.isInteger()) {
                                    def code = dnsStatus.toInteger()
                                    // Nginx 입장에서 502가 안 뜨고 200/401/404가 뜨면 연결 된 것임
                                    if (code != 502 && code != 0) {
                                        isDnsReady = true
                                        break
                                    }
                                }
                            } catch (Exception e) {
                                echo ">>> [2차: DNS Check ${j+1}/20] Nginx가 아직 새 서버를 못 찾음..."
                            }
                        }

                        if (!isDnsReady) {
                            sh "docker rm -f ${targetName}"
                            error("배포 실패: 2차 검증(Nginx DNS) 실패")
                        }

                        echo ">>> [Verified] Nginx 연결 확인됨! 스위칭 진행."

                        // 6) Nginx 스위칭 (이제 안전함)
                        sh "echo 'set \$service_url http://${targetName}:8080;' > switch.tmp"
                        sh "docker cp switch.tmp main-nginx:/etc/nginx/conf.d/${confFile}"
                        sh "docker exec main-nginx nginx -s reload"

                        // ★ [Wait] 기존 트래픽 처리를 위한 대기 (Graceful Shutdown)
                        echo ">>> [Wait] 트래픽 전환 대기 (10초)..."
                        sleep 10

                        // 7) 이전 버전 정리 (Cleanup)
                        def oldColor = (targetColor == 'blue') ? 'green' : 'blue'
                        def oldName = "dev-backend-${oldColor}"
                        echo ">>> [Cleanup] 이전 버전(${oldName})을 정리합니다."
                        sh "docker rm -f ${oldName} || true"
                    }
                }
            }
        }
    }
}