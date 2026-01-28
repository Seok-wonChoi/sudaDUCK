pipeline {
    agent any

    tools {
        jdk 'jdk17'
    }

    environment {
        // [설정] 백엔드 개발 전용 환경 변수
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

        stage('Build Backend') {
            when { branch 'back-dev' }
            steps {
                dir('backend') {
                    script {
                        echo ">>> [Build] 테스트 없이 빌드 수행 (메모리 최적화)"
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
                        echo ">>> [Deploy] 백엔드(Dev) 무중단 배포 시작..."

                        // 1) 도커 이미지 빌드
                        sh "docker build -t ${IMG_BACK}:latest ."

                        // 2) 현재 실행 중인 컬러 확인
                        def confFile = "service-url-dev.inc"
                        def currentUrl = sh(script: "docker exec main-nginx cat /etc/nginx/conf.d/${confFile} || echo 'blue'", returnStdout: true).trim()
                        
                        // 3) 타겟 설정
                        def targetColor = currentUrl.contains("blue") ? "green" : "blue"
                        def targetName = "dev-backend-${targetColor}"
                        def targetPort = (targetColor == "blue" ? "8081" : "8082")

                        echo ">>> [Target] 현재: ${currentUrl} -> 목표: ${targetName} (Port: ${targetPort})"

                        // 4) 청소
                        sh "docker rm -f ${targetName} || true"

                        // 5) 새 컨테이너 실행
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
                        // [1차 검증] 젠킨스 -> 백엔드 (서버가 켜졌는가?)
                        // ========================================================
                        def isHealthy = false
                        for(int i=0; i<15; i++) {
                            sleep 3 
                            def status = sh(script: "curl -s -o /dev/null -w '%{http_code}' http://${targetName}:8080/ || echo '000'", returnStdout: true).trim()
                            echo ">>> [Jenkins Health Check ${i+1}/15] ${targetName} 상태: ${status}"
                            if(status != '000' && status != '502') { 
                                isHealthy = true
                                break 
                            }
                        }

                        if (isHealthy) {
                            echo ">>> [Success] 서버 부팅 완료! 이제 Nginx 연결 가능성을 확인합니다."
                            
                            // ========================================================
                            // ★ [2차 검증] Nginx -> 백엔드 (DNS가 전파되었는가?) - 핵심 로직
                            // ========================================================
                            def nginxCanSee = false
                            for(int j=0; j<20; j++) { // 최대 20초 대기
                                // Nginx 컨테이너 안에서 curl을 실행해 봅니다.
                                // 401, 404, 200 등 응답이 오면 DNS가 풀린 것입니다.
                                def dnsCheck = sh(script: "docker exec main-nginx curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://${targetName}:8080/ || echo 'fail'", returnStdout: true).trim()
                                
                                echo ">>> [Nginx Connectivity ${j+1}/20] Nginx가 보는 상태: ${dnsCheck}"
                                
                                if(dnsCheck != 'fail' && dnsCheck != '000' && dnsCheck != '502') {
                                    nginxCanSee = true
                                    break
                                }
                                sleep 1 // 1초 대기 후 재시도
                            }

                            if (!nginxCanSee) {
                                error("배포 실패: Nginx가 새 컨테이너(${targetName})를 찾지 못합니다 (DNS 문제)")
                            }

                            echo ">>> [Verified] Nginx가 새 서버를 인식했습니다! 스위칭을 진행합니다."

                            // Nginx 스위칭 (이제 502가 뜰 수 없음)
                            sh "echo 'set \$service_url http://${targetName}:8080;' > switch.tmp"
                            sh "docker cp switch.tmp main-nginx:/etc/nginx/conf.d/${confFile}"
                            sh "docker exec main-nginx nginx -s reload"

                            // [Wait] 기존 트래픽 처리 대기 (10초는 필수 - 기존 유저 보호)
                            echo ">>> [Graceful Shutdown] 기존 연결 종료 대기 (10초)..."
                            sleep 10

                            // 이전 버전 정리
                            def oldColor = (targetColor == 'blue') ? 'green' : 'blue'
                            def oldName = "dev-backend-${oldColor}"
                            echo ">>> [Cleanup] 이전 버전(${oldName})을 정리합니다."
                            sh "docker rm -f ${oldName} || true"

                        } else {
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