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
  signal?: AbortSignal;
}

export interface AIProviderInterface {
  chat(options: AIRequestOptions): Promise<string>;
  supportsStreaming: boolean;
}

export class GeminiProvider implements AIProviderInterface {
  supportsStreaming = true;

  async chat(options: AIRequestOptions): Promise<string> {
    const body = {
      messages: options.messages,
      systemPrompt: options.systemPrompt,
      temperature: options.temperature ?? 0.7,
      maxTokens: options.maxTokens ?? 4096,
      stream: !!options.onToken,
    };

    const { data, error } = await supabase.functions.invoke('gemini', {
      body,
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

    if (options.onToken && data) {
      const reader = (data as any).getReader?.();
      if (reader) {
        let accumulated = '';
        const decoder = new TextDecoder();
        try {
          while (true) {
            if (options.signal?.aborted) break;
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(Boolean);
            for (const line of lines) {
              if (options.signal?.aborted) break;
              try {
                const parsed = JSON.parse(line);
                if (parsed.token) { accumulated += parsed.token; options.onToken(parsed.token); }
                if (parsed.error) throw new Error(parsed.error);
              } catch { /* skip malformed */ }
            }
          }
        } finally {
          try { reader.releaseLock(); } catch {}
        }
        options.onComplete?.(accumulated);
        return accumulated;
      }
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
