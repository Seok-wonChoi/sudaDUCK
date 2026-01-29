package com.example.DuckDuck.domain.custom.entity;

import com.example.DuckDuck.domain.custom.enums.CustomCategory;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "custom_item",
        uniqueConstraints = @UniqueConstraint(name = "uk_custom_item", columnNames = {"category", "item_key"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CustomItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "item_id")
    private Long itemId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CustomCategory category;

    @Column(name = "item_key", nullable = false, length = 50)
    private String itemKey;

    @Column(nullable = false)
    private Integer price;

    @Column(name = "is_default_free", nullable = false)
    private Boolean isDefaultFree;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
