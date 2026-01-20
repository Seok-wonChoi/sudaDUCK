package com.example.DuckDuck.domain.game.entity;

import jakarta.persistence.*;
import lombok.*;
import temp.GameSession;
import temp.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "SavedScript")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedScript {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "script_id", nullable = false)
    private Long scriptId;

    // FK_User_Script
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "FK_User_Script")
    )
    private User user;

    // speaker_id는 ERD상 User FK가 따로 없어서 "그대로 컬럼"만 둠
    @Column(name = "speaker_id", nullable = false)
    private Long speakerId;

    // FK_Session_Script
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "session_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "FK_Session_Script")
    )
    private GameSession session;

    @Lob
    @Column(name = "english_content", nullable = false)
    private String englishContent;

    @Lob
    @Column(name = "korean_content")
    private String koreanContent;

    @Column(name = "score")
    private Integer score = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "topic", length = 100)
    private String topic;

    // JSON 컬럼: String으로 매핑
    @Column(name = "participants_list", columnDefinition = "json")
    private String participantsList;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (score == null) score = 0;
    }
}
