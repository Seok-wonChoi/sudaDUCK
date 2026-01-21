package com.example.DuckDuck.domain.room.entity;

import com.example.DuckDuck.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long roomId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User creator; // 방 생성자

    @Column(nullable = false, length = 30)
    private String title;

    @Column(nullable = false, length = 40)
    private String topic;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isOpen = false;

    @Column(nullable = false)
    @Builder.Default
    private Integer turnCnt = 3;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @CreatedDate
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}