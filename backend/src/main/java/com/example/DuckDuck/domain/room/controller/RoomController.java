package com.example.DuckDuck.domain.room.controller;

import com.example.DuckDuck.domain.room.dto.request.RoomCreateRequest;
import com.example.DuckDuck.domain.room.dto.response.RoomCreateResponse;
import com.example.DuckDuck.domain.room.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<RoomCreateResponse> createRoom(@Valid @RequestBody RoomCreateRequest request) {
        RoomCreateResponse response = roomService.createRoom(request);
        return ResponseEntity.ok(response);
    }
}
