package com.example.DuckDuck.domain.game.repository;

import com.example.DuckDuck.domain.game.entity.Sentence;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScriptRepository extends JpaRepository<Sentence, String> {
}
