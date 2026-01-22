package com.example.DuckDuck.domain.user.repository;

import com.example.DuckDuck.domain.user.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<Profile, Long> {
}
