package org.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication // 이 어노테이션이 있어야 스프링 부트로 작동합니다.
public class Main {
    public static void main(String[] args) {
        SpringApplication.run(Main.class, args);
    }
}