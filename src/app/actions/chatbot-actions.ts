'use server';

import { chatWithBot } from '@/ai/flows/chatbot-flow';
import type { ChatbotInput, ChatbotOutput } from '@/ai/flows/chatbot-flow';

export async function sendMessageToChatbotAction(
  input: ChatbotInput
): Promise<ChatbotOutput | { error: string }> {
  try {
    if (!input.userMessage || input.userMessage.trim() === '') {
      return { error: 'Le message ne peut pas être vide.' };
    }

    const result = await chatWithBot(input);

    if (!result || !result.botResponse) {
      console.error('sendMessageToChatbotAction: chatWithBot returned invalid data.');
      return { error: "Je n'ai pas pu générer de réponse. Veuillez réessayer." };
    }
    
    return result;

  } catch (error: any) {
    console.error('Error in sendMessageToChatbotAction:', error);
    return { error: error.message || "Une erreur s'est produite lors de la communication avec le chatbot." };
  }
}
