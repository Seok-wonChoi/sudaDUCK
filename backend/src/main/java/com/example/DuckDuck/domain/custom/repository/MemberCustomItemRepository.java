package com.example.DuckDuck.domain.custom.repository;

import com.example.DuckDuck.domain.custom.entity.MemberCustomItem;
import com.example.DuckDuck.domain.custom.enums.CustomCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Set;

public interface MemberCustomItemRepository extends JpaRepository<MemberCustomItem, Long> {

    @Query("""
        select mci.item.itemId
        from MemberCustomItem mci
        where mci.user.id = :userId
          and mci.item.category = :category
    """)
    Set<Long> findOwnedItemIdsByUserIdAndCategory(@Param("userId") Long userId,
                                                  @Param("category") CustomCategory category);

    boolean existsByUser_IdAndItem_ItemId(Long userId, Long itemId);
}
