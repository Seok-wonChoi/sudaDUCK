pipeline {
    agent any

    tools {
        jdk 'jdk17'
    }

    environment {
        // [설정] 백엔드 개발 전용 환경 변수
        // ★ 중요: 도커 컴포즈에 있는 네트워크 이름과 일치해야 함
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

        // 1. 백엔드 빌드 (메모리 최적화 적용됨)
        stage('Build Backend') {
            when { branch 'back-dev' }
            steps {
                dir('backend') {
                    script {
                        echo ">>> [Build] 테스트 없이 빌드 수행 (16GB 서버 메모리 활용)"
                        sh "chmod +x gradlew"
                        // 16GB 서버에 맞춰 힙 메모리를 2GB로 넉넉하게 할당 (-Xmx2g)
                        sh "./gradlew clean build -x test --no-daemon -Dorg.gradle.jvmargs='-Xmx2g -XX:MaxMetaspaceSize=512m'"
                    }
                }
            }
        }

        // 2. 백엔드 배포 (Health Check 주소 수정됨)
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
                        def currentUrl = sh(script: "docker exec main-nginx cat /etc/nginx/conf.d/${confFile} || echo 'blue'", returnStdout: true).trim()
                        
                        // 3) 타겟 설정 (반대 컬러 선택)
                        def targetColor = currentUrl.contains("blue") ? "green" : "blue"
                        def targetName = "dev-backend-${targetColor}"
                        def targetPort = (targetColor == "blue" ? "8081" : "8082")

                        echo ">>> [Target] 현재: ${currentUrl} -> 목표: ${targetName} (Port: ${targetPort})"

                        // 4) 혹시 남아있을 타겟 컨테이너 청소
                        sh "docker rm -f ${targetName} || true"

                        // 5) [핵심] EC2 설정 파일 주입하여 실행
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
                        // [Health Check] localhost -> targetName으로 변경 (핵심 수정!)
                        // ========================================================
                        def isHealthy = false
                        // 안전하게 15회(45초)까지 대기
                        for(int i=0; i<15; i++) {
                            sleep 3 
                            
                            // ★ 여기가 바뀌었습니다! ★
                            // localhost가 아니라 컨테이너 이름(targetName)과 내부포트(8080) 사용
                            // 이제 젠킨스가 dev-net 안에 있으므로 이름으로 통신 가능
                            def status = sh(script: "curl -s -o /dev/null -w '%{http_code}' http://${targetName}:8080 || echo '000'", returnStdout: true).trim()
                            
                            echo ">>> [Health Check ${i+1}/15] ${targetName} 상태 코드: ${status}"
                            
                            // 000(연결실패)나 502(게이트웨이오류)가 아니면 성공으로 간주
                            if(status != '000' && status != '502') { 
                                isHealthy = true
                                break 
                            }
                        }

                        // 6) 결과 처리 (성공 vs 실패)
                        if (isHealthy) {
                            echo ">>> [Success] 서버 생존 확인! Nginx를 연결합니다."
                            
                            // Nginx 스위칭 (Nginx도 같은 망에 있어야 함)
                            sh "echo 'set \$service_url http://${targetName}:8080;' > switch.tmp"
                            sh "docker cp switch.tmp main-nginx:/etc/nginx/conf.d/${confFile}"
                            sh "docker exec main-nginx nginx -s reload"

                            // 이전 버전 정리 (Cleanup)
                            def oldColor = (targetColor == 'blue') ? 'green' : 'blue'
                            def oldName = "dev-backend-${oldColor}"
                            echo ">>> [Cleanup] 이전 버전(${oldName})을 정리합니다."
                            sh "docker rm -f ${oldName} || true"

                        } else {
                            echo ">>> [Fail] 서버가 뜨지 않습니다. 롤백합니다 (기존 서버 유지)."
                            sh "docker logs --tail 50 ${targetName}" // 왜 죽었는지 로그 출력
                            sh "docker rm -f ${targetName}" // 방금 띄운 죽은 컨테이너 삭제
                            error("배포 실패: Health Check 통과 못함") 
                        }
                    }
                }
            }
        }
    }
}