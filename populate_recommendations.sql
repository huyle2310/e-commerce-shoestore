-- =====================================================
-- POPULATE RECOMMENDATIONS TABLE
-- Công thức: score = 0.5 * cat_affinity + 0.3 * brand_affinity + 0.2 * popularity
-- =====================================================

WITH
user_purchases AS (
    SELECT
        o.user_id,
        p.id      AS product_id,
        p.category_id,
        p.brand_id,
        SUM(oi.quantity) AS qty_purchased
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN product_variants pv ON oi.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    WHERE o.user_id IS NOT NULL
      AND o.order_status != 'CANCELLED'
    GROUP BY o.user_id, p.id, p.category_id, p.brand_id
),
user_total AS (
    SELECT user_id, SUM(qty_purchased) AS total
    FROM user_purchases
    GROUP BY user_id
),
user_category_affinity AS (
    SELECT
        up.user_id,
        up.category_id,
        SUM(up.qty_purchased) * 1.0 / ut.total AS affinity
    FROM user_purchases up
    JOIN user_total ut ON up.user_id = ut.user_id
    GROUP BY up.user_id, up.category_id, ut.total
),
user_brand_affinity AS (
    SELECT
        up.user_id,
        up.brand_id,
        SUM(up.qty_purchased) * 1.0 / ut.total AS affinity
    FROM user_purchases up
    JOIN user_total ut ON up.user_id = ut.user_id
    GROUP BY up.user_id, up.brand_id, ut.total
),
product_popularity AS (
    SELECT
        p.id AS product_id,
        SUM(oi.quantity) AS total_sold
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
        u.user_id,
        p.id AS product_id,
        COALESCE(uca.affinity, 0) AS cat_affinity,
        COALESCE(uba.affinity, 0) AS brand_affinity,
        COALESCE(pp.total_sold, 0) * 1.0 / mp.max_sold AS pop_score,
        ROUND(CAST(
            0.5 * COALESCE(uca.affinity, 0)
          + 0.3 * COALESCE(uba.affinity, 0)
          + 0.2 * (COALESCE(pp.total_sold, 0) * 1.0 / mp.max_sold)
        AS NUMERIC), 4) AS score
    FROM (SELECT DISTINCT user_id FROM user_purchases) u
    CROSS JOIN products p
    LEFT JOIN user_purchases up_check
        ON up_check.user_id = u.user_id AND up_check.product_id = p.id
    LEFT JOIN user_category_affinity uca
        ON uca.user_id = u.user_id AND uca.category_id = p.category_id
    LEFT JOIN user_brand_affinity uba
        ON uba.user_id = u.user_id AND uba.brand_id = p.brand_id
    LEFT JOIN product_popularity pp ON pp.product_id = p.id
    CROSS JOIN max_popularity mp
    WHERE up_check.product_id IS NULL
      AND p.is_active = true
),
ranked AS (
    SELECT
        *,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY score DESC, product_id) AS rn
    FROM scores
    WHERE score > 0
)
INSERT INTO recommendations (user_id, recommended_product_id, score, updated_at)
SELECT user_id, product_id, score, NOW()
FROM ranked
WHERE rn <= 10
ON CONFLICT (user_id, recommended_product_id)
    DO UPDATE SET score = EXCLUDED.score, updated_at = NOW();
