package com.shoes.controller;

import com.shoes.entity.InventoryBatch;
import com.shoes.repository.InventoryBatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/temp-seed")
@RequiredArgsConstructor
@org.springframework.context.annotation.Profile("dev")
@org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
public class TempSeedController {

    private final InventoryBatchRepository inventoryBatchRepository;

    @GetMapping("/dates")
    public ResponseEntity<String> seedDates() {
        List<InventoryBatch> batches = inventoryBatchRepository.findAll();
        if (batches.size() >= 2) {
            InventoryBatch b1 = batches.get(0);
            b1.setImportDate(LocalDateTime.of(2023, 5, 10, 12, 0));
            inventoryBatchRepository.save(b1);

            InventoryBatch b2 = batches.get(1);
            b2.setImportDate(LocalDateTime.of(2024, 8, 15, 12, 0));
            inventoryBatchRepository.save(b2);
            
            return ResponseEntity.ok("Changed dates for batch " + b1.getBatchCode() + " and " + b2.getBatchCode());
        }
        return ResponseEntity.badRequest().body("Not enough batches");
    }
}
