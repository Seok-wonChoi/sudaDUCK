package com.example.DuckDuck.domain.game.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Session", description = "session 관련 API")
@RestController
@RequestMapping("api/v1/session")
@RequiredArgsConstructor
public class SessionController {

//    @Operation(
//            summary = "report화면에서 보여줄 모든 스크립트 조회",
//            description = "한 게임에서 나온 모든 스크립트를 모두 조회합니다."
//    )
//    @GetMapping()
}
