package com.shoes.repository;

import com.shoes.entity.InventoryReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryReceiptRepository extends JpaRepository<InventoryReceipt, UUID> {
    List<InventoryReceipt> findByReceiptTypeOrderByCreatedAtDesc(String receiptType);
}
