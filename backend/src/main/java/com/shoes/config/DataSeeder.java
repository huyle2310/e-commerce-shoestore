package com.shoes.config;

import com.shoes.entity.Brand;
import com.shoes.entity.Category;
import com.shoes.entity.Product;
import com.shoes.entity.ProductVariant;
import com.shoes.entity.ProductImage;
import com.shoes.repository.BrandRepository;
import com.shoes.repository.CategoryRepository;
import com.shoes.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (productRepository.count() > 0) {
            System.out.println("===== DATABASE ALREADY SEEDED. SKIPPING MOCK DATA =====");
            return;
        }

        productRepository.deleteAllInBatch();
        categoryRepository.deleteAllInBatch();
        brandRepository.deleteAllInBatch();

        // 1. Create Brands
        Brand adidas = Brand.builder().name("Adidas").build();
        Brand newBalance = Brand.builder().name("New Balance").build();
        Brand nike = Brand.builder().name("Nike").build();
        brandRepository.saveAll(List.of(adidas, newBalance, nike));

        // 2. Create Categories
        Category c1 = Category.builder().nameVi("Giày Thể Thao").nameEn("Sneakers").slug("sneakers").build();
        categoryRepository.saveAll(List.of(c1));

        // 3. Create Products
        List<Product> products = new ArrayList<>();
        
        products.add(createProduct(c1, adidas, "adidas Originals Superstar II", "adidas Originals Superstar II", "1200000", "Biểu tượng thời trang đường phố với mũi vỏ sò huyền thoại.", ""));
        products.add(createProduct(c1, newBalance, "New Balance 574", "New Balance 574", "1500000", "Đôi giày cổ điển, êm ái và không bao giờ lỗi mốt.", ""));
        products.add(createProduct(c1, newBalance, "New Balance 327", "New Balance 327", "1800000", "Thiết kế retro pha lẫn hiện đại, nổi bật với logo chữ N lớn.", ""));
        products.add(createProduct(c1, newBalance, "New Balance 2002R Protection Pack", "New Balance 2002R Protection Pack", "3500000", "Phiên bản thiết kế rách độc đáo, mang đậm phong cách deconstructed.", ""));
        products.add(createProduct(c1, newBalance, "New Balance 1906R", "New Balance 1906R", "3200000", "Sự trở lại của đôi giày chạy bộ thập niên 2000 với công nghệ hiện đại.", ""));
        products.add(createProduct(c1, newBalance, "New Balance 993 Made in USA", "New Balance 993 Made in USA", "5500000", "Chất lượng hoàn thiện tuyệt hảo, gia công trực tiếp tại Mỹ.", ""));
        products.add(createProduct(c1, adidas, "Adidas Samba OG", "Adidas Samba OG", "2100000", "Thiết kế thanh lịch, từng là giày đá bóng trong nhà giờ trở thành hot trend.", ""));
        products.add(createProduct(c1, nike, "Nike Air Force 1", "Nike Air Force 1", "2500000", "Huyền thoại của Nike, form dáng cứng cáp và cực kỳ dễ phối đồ.", ""));
        products.add(createProduct(c1, nike, "Nike Dunk Low", "Nike Dunk Low", "2800000", "Phong cách trượt ván và bóng rổ, đôi giày không thể thiếu của các sneakerhead.", ""));
        products.add(createProduct(c1, adidas, "Adidas Stan Smith", "Adidas Stan Smith", "1900000", "Thiết kế trắng tinh khôi minimalism, đơn giản mà đẳng cấp.", ""));

        productRepository.saveAll(products);
        System.out.println("===== NEW MOCK DATA SEEDED SUCCESSFULLY (10 Products) =====");
    }

    private Product createProduct(Category cat, Brand brand, String nameVi, String nameEn, String price, String descVi, String descEn) {
        Product p = Product.builder()
                .category(cat)
                .brand(brand)
                .nameVi(nameVi)
                .nameEn(nameEn)
                .slug("vg-" + UUID.randomUUID().toString().substring(0, 8))
                .basePrice(new BigDecimal(price))
                .descriptionVi(descVi)
                .descriptionEn(descEn)
                .targetAudience("UNISEX")
                .isActive(true)
                .build();

        // Thêm 7 variant (size 36 -> 42)
        List<ProductVariant> variants = new ArrayList<>();
        for (int i = 36; i <= 42; i++) {
            variants.add(ProductVariant.builder()
                    .product(p)
                    .sku("SKU-" + nameVi.replaceAll(" ", "").toUpperCase() + "-" + i)
                    .colorVi("Mặc định")
                    .colorEn("Default")
                    .size(String.valueOf(i))
                    .stockQuantity(100) // Tồn kho 100
                    .priceModifier(BigDecimal.ZERO)
                    .build());
        }
        p.setVariants(variants);

        // Thêm placeholder image
        ProductImage img = ProductImage.builder()
                .product(p)
                .imageUrl("https://via.placeholder.com/800x800.png?text=" + nameVi.replaceAll(" ", "+"))
                .isPrimary(true)
                .build();
        p.setImages(List.of(img));

        return p;
    }
}
