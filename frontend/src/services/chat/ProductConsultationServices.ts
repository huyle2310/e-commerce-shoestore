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

    // Chỉ chặn công cụ nếu khách thực sự chỉ chào hỏi hoặc gửi tin nhắn rỗng.
    // Hoặc nếu khách hỏi chung chung về hàng thanh lý (không kèm tên sản phẩm).
    const generalClearanceRegex = /^(shop )?(mình )?(có )?(bán )?(hàng|đồ|giày|sản phẩm)?\s?(thanh lý|sale)\s?(không|ko|k)(\?)?$/i;
    const policyRegex = /(freeship|ship|giao hàng|đổi trả|hủy đơn|bảo hành|bảng size|chọn size|tư vấn size|size giày|khuyến mãi|mã giảm giá|voucher|discount|zalo|liên hệ|mức hạng|hạng|rank)/i;
    const generalInquiryRegex = /^(shop|bạn|bên mình|mình|ad|ở đây)?\s*(có|đang)?\s*(bán|kinh doanh)\s*(những|các)?\s*(sản phẩm|mặt hàng|đồ|gì)\s*(gì|nào|không|ko|k)?\s*(\?)?$/i;
    
    if (greetingRegex.test(content) || content === '' || generalClearanceRegex.test(content) || policyRegex.test(content) || generalInquiryRegex.test(content)) {
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
        description: 'Công cụ tìm kiếm thông tin sản phẩm (giá cả, màu sắc, size, phụ kiện) và lọc theo NGÂN SÁCH. Sử dụng khi khách hỏi về MỘT SẢN PHẨM CỤ THỂ, PHỤ KIỆN (tất, vớ, dây giày, xịt giày, balo...) hoặc khi khách yêu cầu TÌM THEO TẦM GIÁ.',
        parameters: z.object({
          keyword: z.union([z.string(), z.null()]).optional().describe('Từ khóa tìm kiếm (vd: "stan smith", "nike", "phụ kiện", "tất"). TUYỆT ĐỐI KHÔNG truyền giá tiền hay các từ chung chung (như "dưới 20k", "sản phẩm") vào keyword. NẾU khách hỏi tìm HÀNG THANH LÝ, thêm chữ "thanh lý".'),
          minPrice: z.union([z.number(), z.string(), z.null()]).optional().describe('Giá TỐI THIỂU (VNĐ). Dùng khi khách nói "TRÊN", "TỪ", "TRỞ LÊN". VD: "từ 3 triệu trở lên", "trên 3 triệu" -> minPrice = 3000000, maxPrice = null.'),
          maxPrice: z.union([z.number(), z.string(), z.null()]).optional().describe('Giá TỐI ĐA (VNĐ). Dùng khi khách nói "DƯỚI", "ĐẾN", "TRỞ XUỐNG", "ĐỔ LẠI". VD: "dưới 2 triệu", "3 triệu đổ lại" -> maxPrice = 2000000, minPrice = null.'),
          originalQuery: z.string().optional().describe('Nguyên văn câu hỏi của khách hàng (bắt buộc truyền vào).'),
        }),
        // @ts-ignore
        execute: async ({ keyword, minPrice, maxPrice, originalQuery }: { keyword?: any, minPrice?: any, maxPrice?: any, originalQuery?: string }) => {
          try {
            // Xử lý lỗi Llama 3.1 trả về chuỗi "null" thay vì giá trị null thật
            let safeKeyword = (keyword === "null" || keyword === null || keyword === undefined) ? "" : keyword;
            
            // Xóa rác do LLM nhét nhầm vào keyword (ví dụ: "dưới 2 triệu", "sản phẩm")
            if (safeKeyword) {
                const kwLower = safeKeyword.toLowerCase();
                if (kwLower.includes("triệu") || kwLower.includes("dưới") || kwLower.includes("trên") || 
                    kwLower.includes("sản phẩm") || kwLower.includes("mua được gì") || 
                    (kwLower.match(/\d+k/) !== null)) {
                    safeKeyword = "";
                }
            }
            
            let parsedMin = null;
            if (minPrice !== undefined && minPrice !== null && minPrice !== "null" && minPrice !== "") {
                parsedMin = Number(minPrice);
                if (isNaN(parsedMin)) parsedMin = null;
            }

            let parsedMax = null;
            if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "null" && maxPrice !== "") {
                parsedMax = Number(maxPrice);
                if (isNaN(parsedMax)) parsedMax = null;
            }

            // Chữa cháy cho Llama 3.1 ngáo ngơ hay nhầm lẫn min/max
            if (originalQuery) {
                const q = originalQuery.toLowerCase();
                
                // Trực tiếp cào dữ liệu giá nếu AI quên đưa vào min/max
                if (parsedMin === null && parsedMax === null) {
                    const priceMatch = q.match(/(\d+)\s*(k|ngàn|nghìn|triệu|củ)/);
                    if (priceMatch) {
                        let amount = parseInt(priceMatch[1]);
                        const unit = priceMatch[2];
                        if (unit === 'k' || unit === 'ngàn' || unit === 'nghìn') amount *= 1000;
                        if (unit === 'triệu' || unit === 'củ') amount *= 1000000;
                        
                        if (q.includes('trên') || q.includes('từ') || q.includes('lớn hơn')) {
                            parsedMin = amount;
                        } else {
                            parsedMax = amount; // Mặc định khách nói "có 50k", "50k" là maxPrice
                        }
                    }
                } else if (parsedMin !== null && parsedMax === null) {
                    // AI đặt minPrice nhưng câu hỏi không có từ khoá "trên/từ/trở lên" -> Khách thực chất muốn hỏi mức giá tối đa (VD: "tui có 1 triệu")
                    if (!q.includes("trên") && !q.match(/\btừ\b/) && !q.includes("lớn hơn") && !q.includes("trở lên")) {
                        parsedMax = parsedMin;
                        parsedMin = null;
                    }
                } else if (parsedMax !== null && parsedMin === null) {
                    // AI đặt maxPrice nhưng câu hỏi có từ khoá "trên/từ/trở lên"
                    if (q.includes("trên") || q.match(/\btừ\b/) || q.includes("lớn hơn") || q.includes("trở lên")) {
                        parsedMin = parsedMax;
                        parsedMax = null;
                    }
                }
            }

            // Đề phòng trường hợp query rỗng tuếch (AI lọc sai hết) -> chặn không cho gọi API trả về cả mớ
            if (!safeKeyword && parsedMin === null && parsedMax === null) {
                return "Dạ, bên em chuyên kinh doanh các dòng giày thể thao, sneaker và phụ kiện đi kèm. Anh/chị đang muốn tìm sản phẩm nào hoặc tầm giá bao nhiêu ạ?";
            }

            const rawBaseUrl = process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
            const baseUrl = rawBaseUrl.replace(/\/+$/, '');

            let queryParams = [];
            if (safeKeyword) queryParams.push(`keyword=${encodeURIComponent(safeKeyword)}`);
            if (parsedMin !== null) queryParams.push(`minPrice=${parsedMin}`);
            if (parsedMax !== null) queryParams.push(`maxPrice=${parsedMax}`);
            queryParams.push(`exactMatch=true`);
            
            const url = `${baseUrl}/products/search?${queryParams.join('&')}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            
            const data = await response.json();
            let products = [];
            if (data && data.products && Array.isArray(data.products)) {
                products = data.products;
            } else if (Array.isArray(data)) {
                products = data;
            }

            // --- LỌC PHỤ KIỆN DÀNH RIÊNG CHO CHATBOT ---
            const kw = safeKeyword.toLowerCase();
            const isLookingForAccessory = kw.includes("tất") || kw.includes("vớ") || 
                                          kw.includes("dây") || kw.includes("xịt") || 
                                          kw.includes("phụ kiện");

            if (!isLookingForAccessory) {
                products = products.filter((p: any) => {
                    const name = p.nameVi ? p.nameVi.toLowerCase() : "";
                    const cat = p.category?.nameVi ? p.category.nameVi.toLowerCase() : "";
                    const isAcc = name.includes("dây giày") || name.includes("tất") || 
                                  name.includes("vớ") || cat.includes("phụ kiện") || 
                                  name.includes("dép") || name.includes("chai xịt");
                    return !isAcc;
                });
            }
            // ------------------------------------------

            if (products.length === 0) {
                return "Dạ, hiện tại bên em không có sản phẩm nào phù hợp với yêu cầu tìm kiếm của mình ạ. Anh/chị thử tham khảo các dòng sản phẩm khác hoặc đổi từ khóa nhé!";
            }

            // Lấy 5 kết quả đầu
            products = products.slice(0, 5);
            let isClearance = false;
            if (keyword && (keyword.toLowerCase().includes("thanh lý") || keyword.toLowerCase().includes("thanh ly"))) {
                isClearance = true;
            }

                return products.map((p: any) => {
                  const colors = Array.from(new Set(p.variants?.map((v: any) => v.colorVi))).filter(Boolean).join(', ');
                  const sizes = Array.from(new Set(p.variants?.map((v: any) => v.size))).filter(Boolean).join(', ');
                  const hasClearanceBatches = p.clearanceBatches && p.clearanceBatches.length > 0;
                  const minClearancePrice = hasClearanceBatches ? Math.min(...p.clearanceBatches.map((b: any) => b.clearancePrice || p.basePrice)) : null;

                  return {
                    id: p.id,
                    name: isClearance ? `[THANH LÝ] ${p.clearanceNameVi || p.nameVi}` : p.nameVi,
                    slug: isClearance ? `/shop/clearance/${p.slug}` : `/shop/${p.slug}`,
                    price: p.basePrice,
                    discountPrice: isClearance ? minClearancePrice : (p.discountPrice || p.basePrice),
                    colors: colors === 'Mặc định' ? 'Chỉ có 1 màu mặc định' : (colors || 'Không rõ'),
                    sizes: sizes === 'Mặc định' ? 'Freesize' : (sizes || 'Không rõ')
                  };
                });
          } catch (error) {
            console.error("Tool execution error:", error);
            return "Đã xảy ra lỗi khi kết nối tới cơ sở dữ liệu.";
          }
        },
      }),
    };
  }
}
