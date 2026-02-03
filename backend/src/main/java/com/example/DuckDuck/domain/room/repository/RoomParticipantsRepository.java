package com.example.DuckDuck.domain.room.repository;

import com.example.DuckDuck.domain.room.entity.RoomParticipants;
import com.example.DuckDuck.domain.user.entity.Member;
import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
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

    // 대기방에 남아있는 참가자만 조회
    List<RoomParticipants> findByRoom_RoomIdAndIsLeftFalse(Long roomId);

    //사용자가 해당 방의 참여자이고, 아직 나가지 않았는지 확인
    @Query(value =
            "SELECT COUNT(*) > 0 " +
                    "FROM room_participants rp " +
                    "WHERE rp.room_id = :roomId " +
                    "AND rp.user_id = :userId " +
                    "AND rp.is_left = false",
            nativeQuery = true)
    boolean isUserActiveParticipant(@Param("roomId") Long roomId, @Param("userId") Long userId);


    @Query("SELECT rp.user FROM RoomParticipants rp JOIN rp.user u WHERE rp.room.roomId = :roomId AND rp.isLeft = false")
    List<Member> findMembersByRoomId(@Param("roomId") Long roomId);
}
