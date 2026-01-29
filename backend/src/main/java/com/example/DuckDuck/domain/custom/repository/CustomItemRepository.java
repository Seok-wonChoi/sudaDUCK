package com.example.DuckDuck.domain.custom.repository;

import com.example.DuckDuck.domain.custom.entity.CustomItem;
import com.example.DuckDuck.domain.custom.enums.CustomCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface CustomItemRepository extends JpaRepository<CustomItem, Long> {

    List<CustomItem> findByCategoryAndIsActiveTrueOrderByPriceAscItemIdAsc(CustomCategory category);

    Optional<CustomItem> findByCategoryAndItemKeyAndIsActiveTrue(CustomCategory category, String itemKey);
}
