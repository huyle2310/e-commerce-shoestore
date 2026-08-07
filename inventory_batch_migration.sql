-- ==========================================
-- INVENTORY BATCH MIGRATION
-- ==========================================

-- 1. Tạo bảng inventory_batches
CREATE TABLE inventory_batches (
    id UUID PRIMARY KEY,
    batch_code VARCHAR(50) NOT NULL UNIQUE,
    variant_id UUID NOT NULL,
    receipt_item_id UUID,
    parent_batch_id UUID,
    quantity INTEGER NOT NULL,
    warehouse_type VARCHAR(20) DEFAULT 'INVENTORY',
    product_status VARCHAR(20) DEFAULT 'ACTIVE',
    quality_percentage INTEGER DEFAULT 100,
    condition_note TEXT,
    clearance_price NUMERIC(38,2),
    import_date DATE,
    import_price NUMERIC(38,2),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    version BIGINT DEFAULT 0,
    CONSTRAINT fk_batch_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id),
    CONSTRAINT fk_batch_receipt_item FOREIGN KEY (receipt_item_id) REFERENCES inventory_receipt_items(id),
    CONSTRAINT fk_batch_parent FOREIGN KEY (parent_batch_id) REFERENCES inventory_batches(id)
);

-- 2. Đổ dữ liệu từ ProductVariant sang InventoryBatch
-- Mỗi Variant hiện tại có stock_quantity > 0 sẽ được chuyển thành 1 Batch
INSERT INTO inventory_batches (
    id, batch_code, variant_id, quantity, 
    warehouse_type, product_status, quality_percentage, 
    condition_note, clearance_price, import_date, import_price, 
    created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    'B-MIGRATE-' || substr(id::text, 1, 8), -- Sinh mã tạm từ ID variant
    id,
    stock_quantity,
    COALESCE(warehouse_type, 'INVENTORY'),
    COALESCE(product_status, 'ACTIVE'),
    COALESCE(quality_percentage, 100),
    condition_note,
    clearance_price,
    import_date,
    import_price,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM product_variants
WHERE stock_quantity > 0 OR warehouse_type = 'CLEARANCE' OR product_status = 'DISPOSED';
-- Chuyển toàn bộ các variant đang có tồn kho, hoặc đã bị xả kho/tiêu hủy sang batch.

-- 3. Xóa các cột cũ khỏi product_variants
ALTER TABLE product_variants
    DROP COLUMN IF EXISTS warehouse_type,
    DROP COLUMN IF EXISTS product_status,
    DROP COLUMN IF EXISTS quality_percentage,
    DROP COLUMN IF EXISTS condition_note,
    DROP COLUMN IF EXISTS inspection_date,
    DROP COLUMN IF EXISTS clearance_price,
    DROP COLUMN IF EXISTS clearance_reason,
    DROP COLUMN IF EXISTS clearance_date,
    DROP COLUMN IF EXISTS cleared_by,
    DROP COLUMN IF EXISTS disposed_reason,
    DROP COLUMN IF EXISTS disposed_date,
    DROP COLUMN IF EXISTS import_date,
    DROP COLUMN IF EXISTS import_price;
