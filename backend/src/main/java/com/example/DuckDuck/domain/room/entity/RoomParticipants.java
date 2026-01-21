package com.example.DuckDuck.domain.room.entity;

import com.example.DuckDuck.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomParticipants {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long participantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isHost = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isLeft = false;

    @Column(nullable = false)
    private LocalDateTime firstJoinedAt;

    @Column(nullable = false)
    private LocalDateTime lastRejoinedAt;
}