package com.example.DuckDuck.domain.game.entity;

import com.example.DuckDuck.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "sentence")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sentence {

    @Id
    @Column(name = "sentence", length = 255)
    private String sentence;

    /**
     * 문장을 저장(좋아요)한 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 실제 발화자 (닉네임 or userId 문자열)
     */
    @Column(name = "발화자 id", nullable = false, length = 20)
    private String speakerId;

    @Column(name = "영어 문장", nullable = false, length = 255)
    private String englishSentence;

    @Column(name = "한글 문장", nullable = false, length = 255)
    private String koreanSentence;

    @Column(name = "점수", nullable = false)
    private Integer score;

    @Column(name = "주제", length = 40)
    private String topic;

    /**
     * 세션 참여자 snapshot (JSON / CSV)
     */
    @Column(name = "참여자 리스트", nullable = false, length = 255)
    private String participantsList;

    @Column(name = "저장 날짜", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (score == null) score = 0;
    }
}
