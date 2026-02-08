package com.example.DuckDuck.domain.game.repository;

import com.example.DuckDuck.domain.game.entity.Sentence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScriptRepository extends JpaRepository<Sentence, String> {
    List<Sentence> findAllByUserEmailOrderByCreatedAtDesc(String email);
    long countByUserEmail(String email);
}
