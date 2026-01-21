package com.example.DuckDuck.domain.room.controller;

import com.example.DuckDuck.domain.room.dto.request.RoomCreateRequest;
import com.example.DuckDuck.domain.room.dto.request.RoomJoinRequest;
import com.example.DuckDuck.domain.room.dto.response.RoomCreateResponse;
import com.example.DuckDuck.domain.room.dto.response.RoomJoinResponse;
import com.example.DuckDuck.domain.room.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/rooms")
public class RoomController {

    private final RoomService roomService;

    // 방 생성
    @PostMapping
    public ResponseEntity<RoomCreateResponse> createRoom(@Valid @RequestBody RoomCreateRequest request) {
        RoomCreateResponse response = roomService.createRoom(request);
        return ResponseEntity.ok(response);
    }

    // 방 참가(코드 입력)
    @PostMapping("/join")
    public ResponseEntity<RoomJoinResponse> joinRoom(@Valid @RequestBody RoomJoinRequest request) {
        RoomJoinResponse response = roomService.joinRoom(request);
        return ResponseEntity.ok(response);
    }
}
