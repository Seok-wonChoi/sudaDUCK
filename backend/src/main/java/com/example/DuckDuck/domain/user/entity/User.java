package com.example.DuckDuck.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "`User`") // MySQL reserved word -> quoted
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(name = "이메일", nullable = false, length = 100)
    private String email;

    @Column(name = "닉네임", nullable = false, length = 20)
    private String nickname;

    @Column(name = "프로필 이미지 url", columnDefinition = "TEXT")
    private String profileImageUrl;

    @Column(name = "탈퇴 유무", nullable = false)
    private Boolean isActive;

    @Column(name = "최초 가입 일자")
    private LocalDateTime createdAt;

    @Column(name = "업데이트 날짜")
    private LocalDateTime updatedAt;

    // 1:1 Profile (Profile.user_id가 PK)
    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL, optional = true)
    private Profile profile;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
