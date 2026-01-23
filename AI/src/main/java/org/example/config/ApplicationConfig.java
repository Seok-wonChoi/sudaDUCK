package org.example.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.concurrent.Executor;

/**
 * - RestTemplate, ObjectMapper Bean 등록
 * - 비동기 처리를 위한 ThreadPool 설정
 * - 정적 리소스 핸들러 설정 (TTS 파일)
 * - CORS 설정
 */
@Configuration
@EnableAsync
public class ApplicationConfig implements WebMvcConfigurer {

    // ==================== Bean 등록 ====================
    
    /**
     * RestTemplate Bean 등록
     * GPT API 호출에 사용
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
    
    /**
     * ObjectMapper Bean 등록
     * JSON 파싱에 사용
     */
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
    
    // ==================== 비동기 설정 ====================
    
    /**
     * 채팅 처리용 ThreadPool
     * - GPT 번역 + TTS 생성을 비동기로 처리
     * - 기본 5개, 최대 10개 쓰레드
     */
    @Bean(name = "chatTaskExecutor")
    public Executor chatTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // 기본 쓰레드 5개 (항상 대기)
        executor.setCorePoolSize(5);
        
        // 최대 쓰레드 10개 (피크 타임 대응)
        executor.setMaxPoolSize(10);
        
        // 대기 큐 100개 (쓰레드가 모자랄 때 대기)
        executor.setQueueCapacity(100);
        
        // 쓰레드 이름 (로그 추적용)
        executor.setThreadNamePrefix("Chat-Async-");
        
        // 거부 정책: 큐가 가득 차면 호출한 쓰레드가 직접 실행
        executor.setRejectedExecutionHandler(
            new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy()
        );
        
        // 쓰레드가 idle 상태일 때 유지 시간 (초)
        executor.setKeepAliveSeconds(60);
        
        // 종료 시 남은 작업 완료 대기
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        
        executor.initialize();
        return executor;
    }
    
    /**
     * TTS 생성용 ThreadPool (선택사항)
     * - Azure Speech API 호출 전용
     * - 채팅보다 가벼운 작업이므로 쓰레드 수 적게 설정
     */
    @Bean(name = "azureTaskExecutor")
    public Executor ttsTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(3);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("TTS-Async-");
        executor.setRejectedExecutionHandler(
            new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy()
        );
        executor.initialize();
        return executor;
    }
    
    // ==================== Web MVC 설정 ====================
    
    /**
     * 정적 리소스 핸들러 설정
     * - TTS 오디오 파일을 웹에서 접근 가능하도록 설정
     * - URL: /audio/** → 파일 경로: storage/audio/**
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/audio/**")
                .addResourceLocations("file:storage/audio/")
                .setCachePeriod(3600);  // 1시간 캐싱
    }
    
    /**
     * CORS 설정
     * - 프론트엔드에서 API 호출 가능하도록 허용
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000", "http://localhost:5173")  // React/Vite 기본 포트
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
