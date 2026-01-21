package com.example.DuckDuck.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.LocalDateTime;

@Entity
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
    private User user;

    private Integer coins;

    private Integer attendanceDays;

    @Column(columnDefinition = "json")
    private String duckCustomJson;

    @Column(columnDefinition = "json")
    private String avatarCustomJson;

    private LocalDateTime lastLoginAt;

    private Integer totalTime;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}