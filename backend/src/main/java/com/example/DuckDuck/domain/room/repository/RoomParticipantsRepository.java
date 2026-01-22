package com.example.DuckDuck.domain.room.repository;

import com.example.DuckDuck.domain.room.entity.RoomParticipants;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;

public interface RoomParticipantsRepository extends JpaRepository<RoomParticipants, Long> {
    Optional<RoomParticipants> findByRoom_RoomIdAndUser_Id(Long roomId, Long userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        update RoomParticipants rp
        set rp.isLeft = true,
            rp.lastRejoinedAt = :now
        where rp.room.roomId = :roomId
          and rp.isLeft = false
    """)
    int markAllLeftByRoomId(@Param("roomId") Long roomId,
                            @Param("now") LocalDateTime now);
}
