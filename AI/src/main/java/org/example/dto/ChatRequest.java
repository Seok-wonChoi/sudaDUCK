package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {
    private String text;              // 한국어 텍스트
    private Long sequence;            // 클라이언트가 보낸 순서 번호
    private String requestId;         // 선택: 요청 고유 ID
}
