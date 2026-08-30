import { kv } from '@vercel/kv';

export interface ChatMessage {
  id: string;
  fromType: 'buyer' | 'supplier' | 'admin';
  content: string;
  originalContent?: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ChatThread {
  id: string;
  supplierId: string;
  productId: string;
  buyerEmail: string;
  buyerName: string;
  messages: ChatMessage[];
  lastAt: number;
}

const KV_KEY = 'chat_threads';

async function read(): Promise<ChatThread[]> {
  return (await kv.get<ChatThread[]>(KV_KEY)) ?? [];
}

async function write(threads: ChatThread[]): Promise<void> {
  await kv.set(KV_KEY, threads);
}

function threadId(supplierId: string, productId: string, buyerEmail: string): string {
  return `${supplierId}__${productId}__${buyerEmail.toLowerCase().trim()}`;
}

export const chatDb = {
  async getThread(supplierId: string, productId: string, buyerEmail: string): Promise<ChatThread | null> {
    const id = threadId(supplierId, productId, buyerEmail);
    const threads = await read();
    return threads.find((t) => t.id === id) ?? null;
  },

  async getThreadsForSupplier(supplierId: string): Promise<ChatThread[]> {
    const threads = await read();
    return threads
      .filter((t) => t.supplierId === supplierId)
      .sort((a, b) => b.lastAt - a.lastAt);
  },

  async getAllThreads(): Promise<ChatThread[]> {
    const threads = await read();
    return threads.sort((a, b) => b.lastAt - a.lastAt);
  },

  async addMessage(
    supplierId: string,
    productId: string,
    buyerEmail: string,
    buyerName: string,
    fromType: 'buyer' | 'supplier',
    content: string
  ): Promise<ChatThread> {
    const threads = await read();
    const id = threadId(supplierId, productId, buyerEmail);
    let thread = threads.find((t) => t.id === id);

    const msg: ChatMessage = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      fromType,
      content: content.trim(),
      timestamp: Date.now(),
      status: 'pending',
    };

    if (!thread) {
      thread = {
        id,
        supplierId,
        productId,
        buyerEmail: buyerEmail.toLowerCase().trim(),
        buyerName: buyerName.trim(),
        messages: [],
        lastAt: 0,
      };
      threads.push(thread);
    } else if (buyerName && thread.buyerName !== buyerName.trim()) {
      thread.buyerName = buyerName.trim();
    }

    thread.messages.push(msg);
    thread.lastAt = Date.now();
    await write(threads);
    return thread;
  },

  async addAdminMessage(threadId: string, content: string): Promise<ChatThread | null> {
    const threads = await read();
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return null;

    const msg: ChatMessage = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      fromType: 'admin',
      content: content.trim(),
      timestamp: Date.now(),
      status: 'approved',
    };

    thread.messages.push(msg);
    thread.lastAt = Date.now();
    await write(threads);
    return thread;
  },

  async reviewMessage(
    threadId: string,
    messageId: string,
    action: 'approve' | 'reject',
    editedContent?: string
  ): Promise<ChatThread | null> {
    const threads = await read();
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return null;

    const msg = thread.messages.find((m) => m.id === messageId);
    if (!msg) return null;

    if (editedContent && editedContent.trim() !== msg.content) {
      msg.originalContent = msg.content;
      msg.content = editedContent.trim();
    }
    msg.status = action === 'approve' ? 'approved' : 'rejected';

    await write(threads);
    return thread;
  },
};
