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
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "FK_User_Profile")
    )
    private User user;

    @Column(name = "coins")
    private Integer coins = 0;

    @Column(name = "attendance_days")
    private Integer attendanceDays = 0;

    // JSON 컬럼: 가장 안전하게 String으로 매핑
    @Column(name = "duck_custom_json", columnDefinition = "json")
    private String duckCustomJson;

    @Column(name = "avatar_custom_json", columnDefinition = "json")
    private String avatarCustomJson;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "total_time")
    private Integer totalTime = 0; // 누적 학습 시간(초)
}
