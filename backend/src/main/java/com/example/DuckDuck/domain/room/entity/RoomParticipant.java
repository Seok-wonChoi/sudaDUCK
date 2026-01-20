package com.example.DuckDuck.domain.room.entity;
import jakarta.persistence.*;
import lombok.*;
import temp.Room;
import temp.User;

@Entity
@Table(
        name = "RoomParticipant",
        uniqueConstraints = {
                @UniqueConstraint(name = "UK_room_user", columnNames = {"room_id", "user_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "participant_id", nullable = false)
    private Long participantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "room_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "FK_Room_Participant")
    )
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "FK_User_Participant")
    )
    private User user;

    @Column(name = "host")
    private Boolean host = false;

    @Column(name = "ready_status")
    private Boolean readyStatus = false;
}
