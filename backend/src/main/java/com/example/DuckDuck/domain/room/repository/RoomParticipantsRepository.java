package com.example.DuckDuck.domain.room.repository;

import com.example.DuckDuck.domain.room.entity.RoomParticipants;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoomParticipantsRepository extends JpaRepository<RoomParticipants, Long> {
    Optional<RoomParticipants> findByRoom_RoomIdAndUser_Id(Long roomId, Long userId);
}
