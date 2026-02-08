package com.example.DuckDuck.domain.user.service;

import com.example.DuckDuck.domain.game.repository.ScriptRepository;
import com.example.DuckDuck.domain.user.dto.response.MyPageSummaryResponse;
import com.example.DuckDuck.domain.user.entity.Profile;
import com.example.DuckDuck.domain.user.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final ScriptRepository scriptRepository;

    /**
     * 로그인 기준 연속 출석(플레이 연속일) 갱신
     * - 하루에 여러 번 로그인해도 1회만 반영
     * - 어제 로그인했으면 +1
     * - 이틀 이상 공백이면 1로 리셋
     */
    @Transactional
    public void updateAttendanceOnLogin(Profile profile) {
        ZoneId zoneId = ZoneId.of("Asia/Seoul");
        LocalDate today = LocalDate.now(zoneId);
        LocalDateTime now = LocalDateTime.now(zoneId);

        LocalDateTime lastLoginAt = profile.getLastLoginAt();
        int currentDays = profile.getAttendanceDays() == null ? 0 : profile.getAttendanceDays();

        int newDays;
        if (lastLoginAt == null) {
            newDays = 1;
        } else {
            LocalDate lastDate = lastLoginAt.toLocalDate();

            if (lastDate.isEqual(today)) {
                newDays = currentDays;                 // 오늘 이미 처리됨
            } else if (lastDate.isEqual(today.minusDays(1))) {
                newDays = currentDays + 1;             // 연속 출석
            } else {
                newDays = 1;                           // 끊김
            }
        }

        profile.setAttendanceDays(newDays);
        profile.setLastLoginAt(now);
        profileRepository.save(profile);
    }


    @Transactional(readOnly = true)
    public MyPageSummaryResponse getMyPageSummary(Long userId, String email) {

        Profile profile = profileRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Profile not found"));

        int attendanceDays = profile.getAttendanceDays() == null ? 0 : profile.getAttendanceDays();
        long sentenceCount = scriptRepository.countByUserEmail(email);

        return MyPageSummaryResponse.builder()
                .attendanceDays(attendanceDays)
                .sentenceCount(sentenceCount)
                .build();
    }
}
