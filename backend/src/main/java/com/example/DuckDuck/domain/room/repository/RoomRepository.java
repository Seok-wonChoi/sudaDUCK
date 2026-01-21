package com.example.DuckDuck.domain.room.repository;

import com.example.DuckDuck.domain.room.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, Long> {
}
