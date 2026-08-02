import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';

// Cho phép streaming responses lên tới 30s
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    // @ts-ignore - Bypass duplicate provider peer dependency type mismatch
    model: google('gemini-3.5-flash'),
    messages,
    system: "Bạn là nhân viên tư vấn bán hàng của Vanguard. BẮT BUỘC dùng công cụ 'tim_kiem_san_pham' TRƯỚC TIÊN khi khách hỏi mua bất kỳ món gì (giày, dép, tất...). Sau khi tool trả về kết quả (dù có hàng hay không), BẠN PHẢI luôn viết thêm 1-2 câu chat tự nhiên, thân thiện để phản hồi khách (vd: 'Dạ em gửi anh chị một số mẫu ạ' hoặc 'Dạ tiếc quá bên em tạm hết món này ạ'). KHÔNG ĐƯỢC chỉ trả về kết quả tool mà không nói gì thêm.",
    tools: {
      tim_kiem_san_pham: tool({
        description: 'BẮT BUỘC dùng công cụ này để tìm kiếm mọi mặt hàng trong cơ sở dữ liệu của cửa hàng theo từ khóa (tên sản phẩm, loại, hãng, màu sắc...). Luôn gọi tool này trước khi trả lời khách.',
        parameters: z.object({
          keyword: z.string().describe('Từ khóa tìm kiếm (ví dụ: Nike, dép, phụ kiện, đen, trắng...)'),
        }),
        // @ts-ignore - Bypass type error between ai and zod
        execute: async ({ keyword }: { keyword: string }) => {
          try {
            const baseUrl = process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
            const url = `${baseUrl}/products/search?keyword=${encodeURIComponent(keyword)}`;
            const response = await fetch(url);
            if (!response.ok) {
              return "Lỗi khi tìm kiếm sản phẩm";
            }
            const data = await response.json();
            
            // Lấy ra thông tin cần thiết từ kết quả (tránh payload quá lớn)
            if (data && data.products && Array.isArray(data.products)) {
              if (data.products.length === 0) {
                 return "Không tìm thấy sản phẩm nào khớp với từ khóa.";
              }
              return data.products.map((p: any) => ({
                id: p.id,
                name: p.nameVi,
                slug: p.slug,
                brand: p.brand?.name,
                price: p.basePrice || p.price,
                discountPrice: p.discountPrice || p.basePrice,
              })).slice(0, 5); // Trả về tối đa 5 sản phẩm để tránh AI quá tải
            }
            
            return "Không tìm thấy sản phẩm nào khớp với từ khóa.";
          } catch (error) {
            console.error("Tool execution error:", error);
            return "Đã xảy ra lỗi khi kết nối tới cơ sở dữ liệu.";
          }
        },
      }),
    },
    maxSteps: 5,
  });

  return (result as any).toDataStreamResponse ? (result as any).toDataStreamResponse() : (result as any).toTextStreamResponse();
}
