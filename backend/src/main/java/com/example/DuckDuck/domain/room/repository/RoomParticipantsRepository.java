package com.example.DuckDuck.domain.room.repository;

import com.example.DuckDuck.domain.room.entity.RoomParticipants;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomParticipantsRepository extends JpaRepository<RoomParticipants, Long> {
}
