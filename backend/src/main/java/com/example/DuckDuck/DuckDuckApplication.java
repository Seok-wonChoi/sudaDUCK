package com.example.DuckDuck;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import java.time.LocalDateTime;
import java.util.TimeZone;
import jakarta.annotation.PostConstruct;

@SpringBootApplication
public class DuckDuckApplication {

	public static void main(String[] args) {
		SpringApplication.run(DuckDuckApplication.class, args);
	}

	/**
	 * 서버 시작 시 타임존을 한국 시간(KST)으로 설정
	 * (EC2나 도커가 UTC로 되어 있어도 로그 시간이 한국 시간으로 찍힙니다)
	 */
	@PostConstruct
	public void started() {
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Seoul"));
	}

	/**
	 * 스프링 부트가 완전히 로딩되고 실행 준비가 끝났을 때 이 메서드가 실행됩니다.
	 */
	@EventListener(ApplicationReadyEvent.class)
	public void onApplicationEvent() {
		System.out.println("=========================================");
		System.out.println("    🦆 DuckDuck Server is READY! 🦆    ");
		System.out.println("    Started at: " + LocalDateTime.now());
		System.out.println("=========================================");
	}
}