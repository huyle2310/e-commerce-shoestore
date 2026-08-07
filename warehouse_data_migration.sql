-- ==========================================
-- MIGRATE DỮ LIỆU KHO HIỆN TẠI
-- Chuyển tất cả variant vào kho nhập (INVENTORY)
-- Chạy sau warehouse_migration.sql
-- ==========================================

-- Bước 1: Đặt mặc định tất cả variant vào kho nhập, trạng thái hoạt động
UPDATE product_variants
SET
    warehouse_type = 'INVENTORY',
    product_status = 'ACTIVE'
WHERE warehouse_type IS NULL
   OR product_status IS NULL;

-- Bước 2: Cũng đảm bảo các variant đã có giá trị null được fill đúng
UPDATE product_variants
SET warehouse_type = 'INVENTORY'
WHERE warehouse_type IS NULL;

UPDATE product_variants
SET product_status = 'ACTIVE'
WHERE product_status IS NULL;

-- Kiểm tra kết quả
SELECT
    warehouse_type,
    product_status,
    COUNT(*) AS so_luong
FROM product_variants
GROUP BY warehouse_type, product_status
ORDER BY warehouse_type, product_status;

-- ==========================================
-- CHUYỂN SANG KHO THANH LÝ (tùy chọn)
-- Dùng khi muốn chuyển thủ công qua SQL
-- ==========================================

-- Cú pháp chuyển 1 variant sang kho thanh lý:
-- UPDATE product_variants
-- SET
--     warehouse_type    = 'CLEARANCE',
--     product_status    = 'ACTIVE',
--     clearance_price   = <GIA_THANH_LY>,
--     clearance_reason  = '<LY_DO>',
--     clearance_date    = CURRENT_DATE
-- WHERE id = '<UUID_VARIANT>';

-- Ví dụ chuyển tất cả variant có stock = 0 sang thanh lý:
-- UPDATE product_variants
-- SET
--     warehouse_type    = 'CLEARANCE',
--     clearance_price   = price_modifier,   -- dùng tạm giá hiện có
--     clearance_reason  = 'Hết hàng, chuyển thanh lý',
--     clearance_date    = CURRENT_DATE
-- WHERE stock_quantity = 0
--   AND warehouse_type = 'INVENTORY'
--   AND product_status = 'ACTIVE';

-- ==========================================
-- TIÊU HỦY HÀNG HƯ HỎNG (tùy chọn)
-- ==========================================

-- UPDATE product_variants
-- SET
--     product_status  = 'DISPOSED',
--     disposed_reason = '<LY_DO_TIEU_HUY>',
--     disposed_date   = CURRENT_DATE
-- WHERE id = '<UUID_VARIANT>';
