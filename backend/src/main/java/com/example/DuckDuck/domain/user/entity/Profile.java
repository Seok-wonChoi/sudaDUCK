package com.example.DuckDuck.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.LocalDateTime;

@Entity
@Table(name = "profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Profile {

    @Id
    private Long userId;

    @OneToOne
    @MapsId
    @JoinColumn(name = "user_id")
    private Member user;

    private Integer coins;

    private Integer attendanceDays;

    @Column(name = "duck_custom_json", columnDefinition = "json")
    private String duckCustomJson;

    @Column(name = "avatar_custom_json", columnDefinition = "json")
    private String avatarCustomJson;

    @Column(name = "ai_duckbot_custom_json", columnDefinition = "json")
    private String aiDuckbotCustomJson;

    private LocalDateTime lastLoginAt;

    private Integer totalTime;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
