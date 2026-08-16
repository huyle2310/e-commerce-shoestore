import { tool } from 'ai';
import { z } from 'zod';

export class ProductConsultationServices {
  /**
   * Đánh giá tin nhắn của khách hàng để quyết định có cấp công cụ tìm kiếm hay không.
   * Ngăn chặn LLM gọi tool khi khách chỉ hỏi thông tin chung hoặc chào hỏi.
   */
  public static evaluateIntent(lastUserMsg: any): boolean {
    if (!lastUserMsg || typeof lastUserMsg.content !== 'string') return true;

    const content = lastUserMsg.content.trim().toLowerCase();
    const greetingRegex = /^(hi|hello|chào|xin chào|xin chào shop|chào shop|alo|shop|có ai không|ê|ơi|dạ|shop ơi|hello shop|hi shop)(\s+)?$/i;
    const followUpRegex = /(có bảng size|bảng size|có màu gì|màu gì|màu nào|những màu|giá bao nhiêu|có bớt không|freeship|có size|size mấy|mẫu này|đôi này|giày này|sản phẩm này|zalo|liên hệ|địa chỉ|ở đâu|đổi trả|hủy đơn|đặt hàng|mua hàng|bán gì|bán những gì|shop có gì|sản phẩm gì|chương trình khuyến mãi|khuyến mãi|ưu đãi|giảm giá|voucher|mã giảm giá|phí ship|tiền ship)/i;

    if (greetingRegex.test(content) || followUpRegex.test(content) || content === '') {
      return false;
    }
    return true;
  }

  /**
   * Cung cấp các công cụ cho AI
   */
  public static getTools(provideTool: boolean) {
    if (!provideTool) return undefined;

    return {
      tim_kiem_san_pham: tool({
        description: 'Chỉ sử dụng công cụ này khi khách hàng CÓ NHU CẦU MUA hoặc HỎI TÌM MỘT SẢN PHẨM, LOẠI SẢN PHẨM CỤ THỂ. KHÔNG DÙNG công cụ này nếu khách chỉ đang chào hỏi hoặc hỏi những câu chung chung.',
        parameters: z.object({
          keyword: z.string().describe('Từ khóa tìm kiếm sản phẩm. CHỈ trích xuất TÊN RIÊNG hoặc THƯƠNG HIỆU (ví dụ: "taichi", "nike dunk", "adidas"). TUYỆT ĐỐI BỎ QUA các từ loại chung chung (như "giày", "dép", "balo") để tìm kiếm chính xác nhất.'),
        }),
        // @ts-ignore
        execute: async ({ keyword }: { keyword: string }) => {
          try {
            const baseUrl = process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
            const url = `${baseUrl}/products/search?keyword=${encodeURIComponent(keyword)}&exactMatch=true`;
            const response = await fetch(url);
            if (!response.ok) {
              return "Lỗi khi tìm kiếm sản phẩm";
            }
            const data = await response.json();

            if (data && data.products && Array.isArray(data.products)) {
              // Backend already handles exact matching and smart number formatting (e.g., 06 -> 6)
              const filteredProducts = data.products;

              if (filteredProducts.length === 0) {
                return "Không tìm thấy sản phẩm nào khớp với từ khóa.";
              }
              return filteredProducts.map((p: any) => {
                const colors = p.variants ? Array.from(new Set(p.variants.map((v: any) => v.colorVi))).join(', ') : '';
                const sizes = p.variants ? Array.from(new Set(p.variants.map((v: any) => v.size))).join(', ') : '';
                return {
                  id: p.id,
                  name: p.nameVi,
                  slug: p.slug,
                  brand: p.brand?.name,
                  price: p.basePrice || p.price,
                  discountPrice: p.discountPrice || p.basePrice,
                  availableColors: colors || 'Không rõ',
                  availableSizes: sizes || 'Không rõ'
                };
              }).slice(0, 5);
            }

            return "Không tìm thấy sản phẩm nào khớp với từ khóa.";
          } catch (error) {
            console.error("Tool execution error:", error);
            return "Đã xảy ra lỗi khi kết nối tới cơ sở dữ liệu.";
          }
        },
      }),
    };
  }
}
