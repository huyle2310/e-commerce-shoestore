package com.shoes;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.annotation.Rollback;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.List;

@SpringBootTest
public class DeleteTestProductTest {

    @PersistenceContext
    private EntityManager entityManager;

    @Test
    @Transactional
    @Rollback(false)
    public void deleteTestProducts() {
        // Tìm các sản phẩm có chữ "test" hoặc "Test"
        List<Object[]> products = entityManager.createNativeQuery("SELECT id, name_vi FROM products WHERE name_vi ILIKE '%test%'").getResultList();
        
        if (products.isEmpty()) {
            System.out.println("No test products found.");
            return;
        }

        for (Object[] p : products) {
            String idStr = p[0].toString();
            String name = (String) p[1];
            System.out.println("Deleting product: " + name + " (" + idStr + ")");
            
            java.util.UUID pid = java.util.UUID.fromString(idStr);
            
            // Lấy tất cả variant_id của sản phẩm
            List<Object> variantIds = entityManager.createNativeQuery("SELECT id FROM product_variants WHERE product_id = :pid")
                    .setParameter("pid", pid)
                    .getResultList();
                    
            for (Object vidObj : variantIds) {
                java.util.UUID vid = java.util.UUID.fromString(vidObj.toString());
                System.out.println("Deleting variant: " + vid);
                
                // Xóa các bảng liên quan đến variant
                entityManager.createNativeQuery("DELETE FROM cart_items WHERE variant_id = :vid").setParameter("vid", vid).executeUpdate();
                entityManager.createNativeQuery("DELETE FROM order_items WHERE variant_id = :vid").setParameter("vid", vid).executeUpdate();
                entityManager.createNativeQuery("DELETE FROM inventory_batches WHERE variant_id = :vid").setParameter("vid", vid).executeUpdate();
                entityManager.createNativeQuery("DELETE FROM inventory_receipt_items WHERE variant_id = :vid").setParameter("vid", vid).executeUpdate();
            }
            
            // Xóa các bảng liên quan đến product
            entityManager.createNativeQuery("DELETE FROM recommendations WHERE recommended_product_id = :pid").setParameter("pid", pid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM reviews WHERE product_id = :pid").setParameter("pid", pid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM product_images WHERE product_id = :pid").setParameter("pid", pid).executeUpdate();
            
            // Xóa variant và product
            entityManager.createNativeQuery("DELETE FROM product_variants WHERE product_id = :pid").setParameter("pid", pid).executeUpdate();
            entityManager.createNativeQuery("DELETE FROM products WHERE id = :pid").setParameter("pid", pid).executeUpdate();
            
            System.out.println("Successfully deleted product " + name);
        }
    }
}
