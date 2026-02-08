package com.example.DuckDuck.domain.user.repository;

import com.example.DuckDuck.domain.user.entity.Profile;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ProfileRepository extends JpaRepository<Profile, Long> {

    @Modifying
    @Query("UPDATE Profile p SET p.coins = COALESCE(p.coins, 0) + :amount WHERE p.userId = :userId")
    void updateCoins(@Param("userId") Long userId, @Param("amount") int amount);
}
