COPY (SELECT v.sku as "SKU", p.name_vi as "Ten SP", 10 as "So luong", p.base_price as "Gia nhap" FROM product_variants v JOIN products p ON v.product_id = p.id) TO STDOUT WITH CSV HEADER;
