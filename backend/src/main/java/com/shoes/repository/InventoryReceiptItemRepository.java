package com.shoes.repository;

import com.shoes.entity.InventoryReceiptItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface InventoryReceiptItemRepository extends JpaRepository<InventoryReceiptItem, UUID> {
}
