-- ==========================================
-- MIGRATION: Thêm trường quản lý kho vào product_variants
-- Chạy trên PostgreSQL
-- ==========================================

ALTER TABLE product_variants
    ADD COLUMN IF NOT EXISTS warehouse_type     VARCHAR(20)  DEFAULT 'INVENTORY'
        CHECK (warehouse_type IN ('INVENTORY', 'CLEARANCE')),
    ADD COLUMN IF NOT EXISTS product_status     VARCHAR(20)  DEFAULT 'ACTIVE'
        CHECK (product_status IN ('ACTIVE', 'DISPOSED')),
    ADD COLUMN IF NOT EXISTS import_date        DATE,
    ADD COLUMN IF NOT EXISTS import_price       DECIMAL(12,2),
    ADD COLUMN IF NOT EXISTS quality_percentage SMALLINT
        CHECK (quality_percentage BETWEEN 0 AND 100),
    ADD COLUMN IF NOT EXISTS condition_note     TEXT,
    ADD COLUMN IF NOT EXISTS inspection_date    DATE,
    ADD COLUMN IF NOT EXISTS clearance_price    DECIMAL(12,2),
    ADD COLUMN IF NOT EXISTS clearance_reason   TEXT,
    ADD COLUMN IF NOT EXISTS clearance_date     DATE,
    ADD COLUMN IF NOT EXISTS cleared_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS disposed_reason    TEXT,
    ADD COLUMN IF NOT EXISTS disposed_date      DATE;

-- Index để tăng tốc truy vấn lọc kho
CREATE INDEX IF NOT EXISTS idx_variant_warehouse_type   ON product_variants (warehouse_type);
CREATE INDEX IF NOT EXISTS idx_variant_product_status   ON product_variants (product_status);
CREATE INDEX IF NOT EXISTS idx_variant_warehouse_status ON product_variants (warehouse_type, product_status);
CREATE INDEX IF NOT EXISTS idx_variant_quality          ON product_variants (quality_percentage);

-- Cập nhật dữ liệu hiện có: mặc định tất cả variant là kho nhập, đang hoạt động
UPDATE product_variants
SET warehouse_type = 'INVENTORY',
    product_status = 'ACTIVE'
WHERE warehouse_type IS NULL OR product_status IS NULL;

COMMENT ON COLUMN product_variants.warehouse_type     IS 'Loại kho: INVENTORY (kho nhập) hoặc CLEARANCE (kho thanh lý)';
COMMENT ON COLUMN product_variants.product_status     IS 'Trạng thái: ACTIVE (có thể bán) hoặc DISPOSED (đã tiêu hủy)';
COMMENT ON COLUMN product_variants.import_date        IS 'Ngày nhập kho (cập nhật mỗi lần approve phiếu nhập)';
COMMENT ON COLUMN product_variants.import_price       IS 'Giá nhập hiện tại (ghi đè khi có phiếu nhập mới)';
COMMENT ON COLUMN product_variants.quality_percentage IS 'Chất lượng sản phẩm 0-100%';
COMMENT ON COLUMN product_variants.condition_note     IS 'Mô tả tình trạng sản phẩm khi kiểm kê';
COMMENT ON COLUMN product_variants.inspection_date    IS 'Ngày kiểm kê gần nhất';
COMMENT ON COLUMN product_variants.clearance_price    IS 'Giá bán trên trang Xả Kho';
COMMENT ON COLUMN product_variants.clearance_reason   IS 'Lý do thanh lý';
COMMENT ON COLUMN product_variants.clearance_date     IS 'Ngày chuyển sang kho thanh lý';
COMMENT ON COLUMN product_variants.cleared_by         IS 'Người thực hiện thanh lý (FK users)';
COMMENT ON COLUMN product_variants.disposed_reason    IS 'Lý do tiêu hủy';
COMMENT ON COLUMN product_variants.disposed_date      IS 'Ngày tiêu hủy';
