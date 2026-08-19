import { streamText } from 'ai';
import { GroundedAIProvider } from '@/services/chat/GroundedAIProvider';
import { ProductConsultationServices } from '@/services/chat/ProductConsultationServices';

// Cho phép streaming responses lên tới 30s
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 1. Phân tích ý định người dùng (Intent Evaluation)
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const provideTool = ProductConsultationServices.evaluateIntent(lastUserMsg);

    // 2. Lấy công cụ và chuẩn bị Context (Grounding)
    const aiTools = ProductConsultationServices.getTools(provideTool);
    const processedMessages = GroundedAIProvider.injectToolContext(messages);

    // 3. Thực thi Chat Pipeline
    const result = await streamText({
      model: GroundedAIProvider.getModel(),
      messages: processedMessages,
      system: GroundedAIProvider.getSystemPrompt(),
      tools: aiTools,
      maxSteps: 5,
    });

    return (result as any).toDataStreamResponse ? (result as any).toDataStreamResponse({
      getErrorMessage: (error: any) => {
        console.error("STREAM ERROR CAUGHT:", error);
        return error instanceof Error ? error.message : String(error);
      }
    }) : (result as any).toTextStreamResponse();
  } catch (error: any) {
    console.error("API Route Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error", message: error.message || "Internal Server Error" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
