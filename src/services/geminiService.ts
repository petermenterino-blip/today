import { edgeFunctionService } from './edgeFunctionService';

export const chatWithAssistant = async (
  history: { role: 'user' | 'model'; text: string }[],
  message: string
): Promise<string> => {
  try {
    const context = {
      history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
    };
    const response = await edgeFunctionService.gemini(message, 'chat', context);
    return response || "I'm not sure how to respond to that. Could you rephrase?";
  } catch (e) {
    console.error('[geminiService] Chat failed:', e);
    return "I'm sorry, I'm experiencing some technical difficulties. Please try again.";
  }
};
