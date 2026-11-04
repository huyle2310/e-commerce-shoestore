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
        Brand adidas = brandRepository.save(Brand.builder().name("Adidas").build());
        Brand newBalance = brandRepository.save(Brand.builder().name("New Balance").build());
        Brand nike = brandRepository.save(Brand.builder().name("Nike").build());
        Brand ananas = brandRepository.save(Brand.builder().name("Ananas").build());
        Brand supreme = brandRepository.save(Brand.builder().name("Supreme").build());
        Brand troiNoi = brandRepository.save(Brand.builder().name("Trôi nổi").build());
        Brand taichi = brandRepository.save(Brand.builder().name("Taichi").build());

        // 2. Create Categories
        Category giayTheThao = categoryRepository.save(
                Category.builder().nameVi("Giày Thể Thao").nameEn("Sneakers").slug("giay-the-thao").build());
        Category depThoiTrang = categoryRepository.save(
                Category.builder().nameVi("Dép thời trang").nameEn("Sandals").slug("dep-thoi-trang").build());
        Category phuKien = categoryRepository.save(
                Category.builder().nameVi("Phụ Kiện").nameEn("Accessories").slug("phu-kien").build());
        Category giayThoiTrang = categoryRepository.save(
                Category.builder().nameVi("Giày thời trang").nameEn("Fashion Shoes").slug("giay-thoi-trang").build());

        // 3. Create Products (UUIDs cố định khớp với database)
        List<Product> products = new ArrayList<>();

        // ===== ADIDAS =====
        products.add(createProduct(
                UUID.fromString("f06d82d1-fc05-4a90-b81c-f4ef13249b75"),
                giayTheThao, adidas,
                "adidas Originals Superstar II", "adidas Originals Superstar II",
                "adidas-originals-superstar-ii",
                "1200000",
                "Biểu tượng thời trang đường phố với mũi vỏ sò huyền thoại.",
                "Biểu tượng thời trang đường phố với mũi vỏ sò huyền thoại.",
                "NAM"
        ));

        products.add(createProduct(
                UUID.fromString("5fc0a470-fc21-4a1b-be67-64c6da2c2de3"),
                giayTheThao, adidas,
                "Adidas Samba OG", "Adidas Samba OG",
                "adidas-samba-og",
                "2099000",
                "Thiết kế thanh lịch, từng là giày đá bóng trong nhà giờ trở thành hot trend.",
                "Thiết kế thanh lịch, từng là giày đá bóng trong nhà giờ trở thành hot trend.",
                "NAM"
        ));

        products.add(createProduct(
                UUID.fromString("756766e9-4335-4093-b201-d30ae528ef1d"),
                giayTheThao, adidas,
                "Adidas Stan Smith", "Adidas Stan Smith",
                "adidas-stan-smith",
                "1900000",
                "Thiết kế trắng tinh khôi minimalism, đơn giản mà đẳng cấp.",
                "Thiết kế trắng tinh khôi minimalism, đơn giản mà đẳng cấp.",
                "NAM"
        ));

        // ===== NEW BALANCE =====
        products.add(createProduct(
                UUID.fromString("062bbf1f-0145-4836-a17b-a51e9b8a5f69"),
                giayTheThao, newBalance,
                "New Balance 574", "New Balance 574",
                "new-balance-574",
                "1490000",
                "Đôi giày cổ điển, êm ái và không bao giờ lỗi mốt.",
                "Đôi giày cổ điển, êm ái và không bao giờ lỗi mốt.",
                "UNISEX"
        ));

        products.add(createProduct(
                UUID.fromString("4dc74e04-6bd8-4d8f-bb39-ccd30d70aa5f"),
                giayTheThao, newBalance,
                "New Balance 327", "New Balance 327",
                "new-balance-327",
                "1750000",
                "Thiết kế retro pha lẫn hiện đại, nổi bật với logo chữ N lớn.",
                "Thiết kế retro pha lẫn hiện đại, nổi bật với logo chữ N lớn.",
                "UNISEX"
        ));

        products.add(createProduct(
                UUID.fromString("0adefc85-dfc0-4e30-b0f7-10f28e0c8ce3"),
                giayTheThao, newBalance,
                "New Balance 2002R Protection Pack", "New Balance 2002R Protection Pack",
                "new-balance-2002r-protection-pack",
                "3500000",
                "Phiên bản thiết kế rách độc đáo, mang đậm phong cách deconstructed.",
                "Phiên bản thiết kế rách độc đáo, mang đậm phong cách deconstructed.",
                "NU"
        ));

        products.add(createProduct(
                UUID.fromString("9d95772e-1454-4da5-9403-4c705fb3f3c2"),
                giayTheThao, newBalance,
                "New Balance 1906R", "New Balance 1906R",
                "new-balance-1906r",
                "3180000",
                "Sự trở lại của đôi giày chạy bộ thập niên 2000 với công nghệ hiện đại.",
                "Sự trở lại của đôi giày chạy bộ thập niên 2000 với công nghệ hiện đại.",
                "NU"
        ));

        products.add(createProduct(
                UUID.fromString("3ef4c7c5-3987-4b5a-bc4e-332b6c6a1483"),
                giayTheThao, newBalance,
                "New Balance 993 Made in USA", "New Balance 993 Made in USA",
                "new-balance-993-made-in-usa",
                "5490000",
                "Chất lượng hoàn thiện tuyệt hảo, gia công trực tiếp tại Mỹ.",
                "Chất lượng hoàn thiện tuyệt hảo, gia công trực tiếp tại Mỹ.",
                "NU"
        ));

        // ===== NIKE =====
        products.add(createProduct(
                UUID.fromString("74bc0b6d-a368-4a95-9d2c-ee54d9ed4e03"),
                giayThoiTrang, nike,
                "Nike Air Force 1", "Nike Air Force 1",
                "nike-air-force-1",
                "3519000",
                "Thoải mái, bền bỉ và vượt thời gian – đó là lý do tại sao nó đứng đầu. Thiết kế cổ điển của thập niên 80 kết hợp với các chi tiết nổi bật tạo nên phong cách phù hợp dù bạn đang ở trên sân hay đang di chuyển.",
                "Thoải mái, bền bỉ và vượt thời gian – đó là lý do tại sao nó đứng đầu. Thiết kế cổ điển của thập niên 80 kết hợp với các chi tiết nổi bật tạo nên phong cách phù hợp dù bạn đang ở trên sân hay đang di chuyển.",
                "UNISEX"
        ));

        products.add(createProduct(
                UUID.fromString("a9f6e436-60b7-4d1c-baab-52bf681ca2e2"),
                giayTheThao, nike,
                "Nike Dunk Low", "Nike Dunk Low",
                "nike-dunk-low",
                "2799000",
                "Phong cách trượt ván và bóng rổ, đôi giày không thể thiếu của các sneakerhead.",
                "Phong cách trượt ván và bóng rổ, đôi giày không thể thiếu của các sneakerhead.",
                "UNISEX"
        ));

        // ===== ANANAS =====
        products.add(createProduct(
                UUID.fromString("06b4da17-fdf9-4382-8848-851a44299e06"),
                giayThoiTrang, ananas,
                "Ananas Track 6 OG - Low Top - 70s White", "Ananas Track 6 OG - Low Top - 70s White",
                "ananas-track-6-og-low-top-70s-white",
                "990000",
                "Với cảm hứng từ Retro Sneakers và âm nhạc giai đoạn 1970s, Ananas Track 6 ra đời với danh hiệu là mẫu giày Cold Cement đầu tiên của Ananas.",
                "Với cảm hứng từ Retro Sneakers và âm nhạc giai đoạn 1970s, Ananas Track 6 ra đời với danh hiệu là mẫu giày Cold Cement đầu tiên của Ananas.",
                "UNISEX"
        ));

        products.add(createProduct(
                UUID.fromString("90933eaf-dd5f-4f5f-87f7-186fd1525ad6"),
                giayTheThao, ananas,
                "Basas Mono Black NE - Low Top - All Black", "Basas Mono Black NE - Low Top - All Black",
                "basas-mono-black-ne-low-top-all-black",
                "520000",
                "Nâng cấp chất liệu vải mới bền màu ổn định, kết hợp cùng vẻ ngoài ton sur ton từ trên xuống dưới cùng sắc đen cá tính.",
                "Nâng cấp chất liệu vải mới bền màu ổn định, kết hợp cùng vẻ ngoài ton sur ton từ trên xuống dưới cùng sắc đen cá tính.",
                "UNISEX"
        ));

        // ===== TAICHI =====
        products.add(createProduct(
                UUID.fromString("5ba160a8-699e-4110-b1da-66f13f9e72f4"),
                giayTheThao, taichi,
                "Giày bóng rổ nam PEAK Taichi Big Triangle 4.0 Pro", "Giày bóng rổ nam PEAK Taichi Big Triangle 4.0 Pro",
                "giay-bong-ro-nam-peak-taichi-big-triangle-4-0-pro",
                "3490000",
                "PEAK Big Triangle 4.0 Pro là mẫu giày bóng rổ hiệu năng cao được phát triển dành cho những cầu thủ yêu thích tốc độ, khả năng đổi hướng linh hoạt và cảm giác bám sân chắc chắn.",
                "PEAK Big Triangle 4.0 Pro là mẫu giày bóng rổ hiệu năng cao được phát triển dành cho những cầu thủ yêu thích tốc độ, khả năng đổi hướng linh hoạt và cảm giác bám sân chắc chắn.",
                "NAM"
        ));

        // ===== PHỤ KIỆN =====
        products.add(createProduct(
                UUID.fromString("da3a7f03-7d12-4eeb-a443-5d06e1930857"),
                phuKien, troiNoi,
                "Dây giày thể thao", "Dây giày thể thao",
                "day-giay-the-thao",
                "1000",
                "Dây giày thể thao xanh dương",
                "Dây giày thể thao xanh dương",
                "PHU_KIEN"
        ));

        products.add(createProduct(
                UUID.fromString("d79ff8c3-3f78-4ba6-befe-487743601b9b"),
                phuKien, troiNoi,
                "Vớ Dài Basic Freesize", "Vớ Dài Basic Freesize",
                "vo-dai-basic-freesize",
                "59000",
                "Mẫu vớ dài freesize được đội ngũ thiết kế chú trọng đến sự tiện lợi và thoải mái, sản phẩm này vẫn mang đến vẻ đẹp thanh lịch và sang trọng. Với những ưu điểm vượt trội, đây chắc chắn là món đồ bạn sẽ muốn sở hữu ngay trong tủ đồ của mình.",
                "Mẫu vớ dài freesize được đội ngũ thiết kế chú trọng đến sự tiện lợi và thoải mái, sản phẩm này vẫn mang đến vẻ đẹp thanh lịch và sang trọng. Với những ưu điểm vượt trội, đây chắc chắn là món đồ bạn sẽ muốn sở hữu ngay trong tủ đồ của mình.",
                "UNISEX"
        ));

        products.add(createProduct(
                UUID.fromString("c79ee50a-0145-4945-9f73-0339b25bc0ff"),
                phuKien, troiNoi,
                "Xịt khử mùi giày NANO bạc 260ml cao cấp", "Xịt khử mùi giày NANO bạc 260ml cao cấp",
                "x-t-kh-m-i-gi-y-nano-b-c-260ml-cao-c-p",
                "170000",
                "Xịt khử mùi giày NANO bạc 260ml cao cấp, giúp khử mùi giày, dép, hôi chân, tủ quần áo, mùi ẩm mốc, mùi dầu mỡ trong nhà bếp hiệu quả nhanh chóng, mang lại mùi thơm dịu nhẹ, dễ chịu.",
                "Xịt khử mùi giày NANO bạc 260ml cao cấp, giúp khử mùi giày, dép, hôi chân, tủ quần áo, mùi ẩm mốc, mùi dầu mỡ trong nhà bếp hiệu quả nhanh chóng, mang lại mùi thơm dịu nhẹ, dễ chịu.",
                "PHU_KIEN"
        ));

        // ===== DÉP =====
        products.add(createProduct(
                UUID.fromString("5f099001-74c5-4523-8798-c094ea3d6cce"),
                depThoiTrang, supreme,
                "Supreme Dép tổ ong vjp pro Limited Edition", "Supreme Dép tổ ong vjp pro Limited Edition",
                "supreme-dep-to-ong-vjp-pro-limited-edition",
                "49000",
                "Huyền thoại.",
                "Huyền thoại.",
                "UNISEX"
        ));

        productRepository.saveAll(products);
        System.out.println("===== NEW MOCK DATA SEEDED SUCCESSFULLY (" + products.size() + " Products) =====");
    }

    private Product createProduct(UUID id, Category cat, Brand brand, String nameVi, String nameEn,
                                   String slug, String price, String descVi, String descEn, String targetAudience) {
        Product p = Product.builder()
                .id(id)
                .category(cat)
                .brand(brand)
                .nameVi(nameVi)
                .nameEn(nameEn)
                .slug(slug)
                .basePrice(new BigDecimal(price))
                .descriptionVi(descVi)
                .descriptionEn(descEn)
                .targetAudience(targetAudience)
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
                    .stockQuantity(30)
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
