package com.example.DuckDuck.domain.room.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomEndResponse {
    private Long roomId;
    private String roomCode;
    private Boolean isOpen;   // 항상 false로 내려줄 것
    private String message;   // "대기방으로 전환 완료" / "이미 대기방입니다"
}
