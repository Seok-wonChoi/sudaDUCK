package com.example.DuckDuck.domain.room.entity;

import com.example.DuckDuck.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "Room")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Long id;

    // DDL: Room.user_id (방 생성자/소유자)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User owner;

    @Column(name = "방 제목", nullable = false, length = 30)
    private String title;

    @Column(name = "대화 주제", nullable = false, length = 40)
    private String topic;

    @Column(name = "현재 방 게임 여부", nullable = false)
    private Boolean isGameActive;

    @Column(name = "게임 중 대화 턴수", nullable = false)
    private Integer turnCount;

    @Column(name = "게임 시작 시간", nullable = false)
    private LocalDateTime gameStartedAt;

    @Column(name = "방 생성 시간", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "방 편집 시간", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "room", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RoomParticipants> participants = new ArrayList<>();

    @PrePersist
    public void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (isGameActive == null) isGameActive = false;
        if (turnCount == null) turnCount = 3;
        if (gameStartedAt == null) gameStartedAt = LocalDateTime.now(); // 필요 시 null 허용으로 바꾸는 것도 가능
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
