import { supabase } from '../lib/supabase';

export type AIModel = 'gemini-2.0-flash' | 'gemini-2.5-pro' | 'gpt-4o' | 'gpt-4o-mini' | 'claude-3-sonnet' | 'claude-3-opus';
export type AIProvider = 'google' | 'openai' | 'anthropic';

export interface AIChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface AIRequestOptions {
  messages: AIChatMessage[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  onToken?: (token: string) => void;
  onComplete?: (full: string) => void;
  onError?: (error: string) => void;
}

export interface AIProviderInterface {
  chat(options: AIRequestOptions): Promise<string>;
  supportsStreaming: boolean;
}

export class GeminiProvider implements AIProviderInterface {
  supportsStreaming = true;

  async chat(options: AIRequestOptions): Promise<string> {
    const { data, error } = await supabase.functions.invoke('gemini', {
      body: {
        messages: options.messages,
        systemPrompt: options.systemPrompt,
        temperature: options.temperature ?? 0.7,
        maxTokens: options.maxTokens ?? 4096,
        stream: options.stream ?? false,
      },
    });

    if (error) {
      const msg = error.message || 'Failed to reach AI service';
      options.onError?.(msg);
      throw new Error(msg);
    }

    if (data?.error) {
      options.onError?.(data.error);
      throw new Error(data.error);
    }

    const text = data?.result || data?.text || '';
    options.onComplete?.(text);
    return text;
  }
}

export function createAIProvider(provider: AIProvider = 'google'): AIProviderInterface {
  switch (provider) {
    case 'google': return new GeminiProvider();
    default: return new GeminiProvider();
  }
}
