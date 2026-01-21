package com.example.DuckDuck.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "Profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Profile {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "꾸미기 코인")
    private Integer coins;

    @Column(name = "연속 출석 일자")
    private Integer attendanceDays;

    @Column(name = "duck_custom_json", columnDefinition = "JSON")
    private String duckCustomJson;

    @Column(name = "avatar_custom_json", columnDefinition = "JSON")
    private String avatarCustomJson;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "총 플레이타임")
    private Integer totalPlayTime; // 분/초 단위는 서비스 기준으로 통일 추천

    @Column(name = "프로필 생성 날짜")
    private LocalDateTime createdAt;

    @Column(name = "프로필 수정 날짜")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (coins == null) coins = 0;
        if (attendanceDays == null) attendanceDays = 0;
        if (totalPlayTime == null) totalPlayTime = 0;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
