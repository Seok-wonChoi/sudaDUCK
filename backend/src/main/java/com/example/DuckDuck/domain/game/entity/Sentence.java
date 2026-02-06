package com.example.DuckDuck.domain.game.entity;

import com.example.DuckDuck.domain.user.entity.Member;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;

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
    @Column(length = 255)
    private String sentenceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Member user;

    @Column(nullable = false, length = 20)
    private String speakerName;

    @Column(nullable = false, length = 255)
    private String englishSentence;

    @Column(nullable = false, length = 255)
    private String koreanSentence;

    @Column(nullable = false)
    private Integer score;

    @Column(length = 40)
    private String topic;

    @Column(nullable = false, length = 255)
    private String participantList;

    @Column(name = "tts_url", length = 512)
    private String ttsUrl; // 새로 추가

    @Column(name = "similarity_phrases", columnDefinition = "TEXT")
    private String similarityPhrases;

    @CreatedDate
    @Column(nullable = false)
    private LocalDateTime createdAt;
}
