package com.example.DuckDuck;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing //생성일/수정일이 자동으로 입력
@SpringBootApplication
public class DuckDuckApplication {

	public static void main(String[] args) {
		SpringApplication.run(DuckDuckApplication.class, args);
	}

}
