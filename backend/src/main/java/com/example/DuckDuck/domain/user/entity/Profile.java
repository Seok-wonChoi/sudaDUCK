package com.example.DuckDuck.domain.user.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "Profile")
@Getter
@Setter
@NoArgsConstructor
public class Profile {
    @Id
    private Long userId;

    @OneToOne
    @MapsId // User의 PK를 Profile의 PK로 사용
    @JoinColumn(name = "user_id")
    private User user;

    private Integer coins = 0;
    private Integer attendanceDays = 0;

    @Column(columnDefinition = "json")
    private String duckCustomJson;

    @Column(columnDefinition = "json")
    private String avatarCustomJson;

    private LocalDateTime lastLoginAt;
    private Integer totalTime = 0;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}