package com.example.DuckDuck.domain.room.entity;

import com.example.DuckDuck.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "RoomParticipants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomParticipants {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "참여자 ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "방장 여부", nullable = false)
    private Boolean isHost;

    @Column(name = "현재 방에 존재 여부", nullable = false)
    private Boolean isPresent;

    @Column(name = "방 처음 들어온 날짜", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "방 다시 들어온 날짜", nullable = false)
    private LocalDateTime rejoinedAt;

    // DDL엔 없지만 네가 올려준 최신 설계에는 updated_at 있음
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        if (joinedAt == null) joinedAt = LocalDateTime.now();
        if (rejoinedAt == null) rejoinedAt = joinedAt;
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (isHost == null) isHost = false;
        if (isPresent == null) isPresent = false;
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
