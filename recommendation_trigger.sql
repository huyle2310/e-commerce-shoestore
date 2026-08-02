-- =====================================================
-- TRIGGER: Tự động cập nhật bảng recommendations
-- Kích hoạt khi: INSERT order mới HOẶC order_status -> 'DELIVERED'
-- =====================================================

-- BƯỚC 1: Tạo hàm tính lại recommendation cho 1 user cụ thể
CREATE OR REPLACE FUNCTION refresh_recommendations_for_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Xóa recommendations cũ của user này
    DELETE FROM recommendations WHERE user_id = p_user_id;

    -- Tính lại và insert top 10 mới
    WITH
    user_purchases AS (
        SELECT
            o.user_id,
            p.id          AS product_id,
            p.category_id,
            p.brand_id,
            SUM(oi.quantity) AS qty_purchased
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN product_variants pv ON oi.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        WHERE o.user_id = p_user_id
          AND o.order_status != 'CANCELLED'
        GROUP BY o.user_id, p.id, p.category_id, p.brand_id
    ),
    user_total AS (
        SELECT SUM(qty_purchased) AS total FROM user_purchases
    ),
    user_category_affinity AS (
        SELECT up.category_id,
               SUM(up.qty_purchased) * 1.0 / ut.total AS affinity
        FROM user_purchases up, user_total ut
        GROUP BY up.category_id, ut.total
    ),
    user_brand_affinity AS (
        SELECT up.brand_id,
               SUM(up.qty_purchased) * 1.0 / ut.total AS affinity
        FROM user_purchases up, user_total ut
        GROUP BY up.brand_id, ut.total
    ),
    product_popularity AS (
        SELECT p.id AS product_id, SUM(oi.quantity) AS total_sold
        FROM order_items oi
        JOIN product_variants pv ON oi.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        GROUP BY p.id
    ),
    max_popularity AS (
        SELECT MAX(total_sold) AS max_sold FROM product_popularity
    ),
    scores AS (
        SELECT
            p.id AS product_id,
            ROUND(CAST(
                0.5 * COALESCE(uca.affinity, 0)
              + 0.3 * COALESCE(uba.affinity, 0)
              + 0.2 * (COALESCE(pp.total_sold, 0) * 1.0 / NULLIF(mp.max_sold, 0))
            AS NUMERIC), 4) AS score
        FROM products p
        -- Loại trừ sản phẩm đã mua
        LEFT JOIN user_purchases up_check ON up_check.product_id = p.id
        LEFT JOIN user_category_affinity uca ON uca.category_id = p.category_id
        LEFT JOIN user_brand_affinity uba ON uba.brand_id = p.brand_id
        LEFT JOIN product_popularity pp ON pp.product_id = p.id
        CROSS JOIN max_popularity mp
        WHERE up_check.product_id IS NULL
          AND p.is_active = true
    ),
    ranked AS (
        SELECT product_id, score,
               ROW_NUMBER() OVER (ORDER BY score DESC, product_id) AS rn
        FROM scores
        WHERE score > 0
    )
    INSERT INTO recommendations (user_id, recommended_product_id, score, updated_at)
    SELECT p_user_id, product_id, score, NOW()
    FROM ranked
    WHERE rn <= 10;

END;
$$ LANGUAGE plpgsql;


-- BƯỚC 2: Tạo hàm trigger (gọi hàm trên)
CREATE OR REPLACE FUNCTION trg_refresh_recommendations()
RETURNS TRIGGER AS $$
BEGIN
    -- Chỉ xử lý khi user_id không null
    IF NEW.user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Trường hợp INSERT: đơn hàng mới được tạo
    -- Trường hợp UPDATE: status vừa chuyển sang CANCELLED (đơn bị huỷ → tính lại vì sp đó không còn là "đã mua")
    IF (TG_OP = 'INSERT') OR
       (TG_OP = 'UPDATE' AND NEW.order_status = 'CANCELLED' AND OLD.order_status != 'CANCELLED')
    THEN
        PERFORM refresh_recommendations_for_user(NEW.user_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- BƯỚC 3: Gắn trigger vào bảng orders
DROP TRIGGER IF EXISTS trg_orders_refresh_recommendations ON orders;

CREATE TRIGGER trg_orders_refresh_recommendations
AFTER INSERT OR UPDATE OF order_status ON orders
FOR EACH ROW
EXECUTE FUNCTION trg_refresh_recommendations();
