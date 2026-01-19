package temp;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

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
    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "room_code", nullable = false, unique = true, length = 10)
    private String roomCode;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "topic", length = 100)
    private String topic;

    @Column(name = "start_status")
    private Boolean startStatus = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "turn_cnt")
    private Integer turnCnt = 3;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (startStatus == null) startStatus = true;
        if (turnCnt == null) turnCnt = 3;
    }
}
