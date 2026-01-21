package com.example.DuckDuck.domain.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/v1/auth")
public class AuthController {

    @GetMapping("/me")
    public ResponseEntity<?> getMyInfo(Authentication authentication){
        if (authentication == null){
            return ResponseEntity.status(401).body("인증되지 않은 사용자입니다.");
        }
        return ResponseEntity.ok("현재 로그인 유저: " + authentication.getPrincipal());
    }
}
