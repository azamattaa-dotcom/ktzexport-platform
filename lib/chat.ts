import { eq } from 'drizzle-orm';
import { drizzleDb } from './drizzle';
import * as schema from './schema';

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

type ChatThreadRow = typeof schema.chatThreads.$inferSelect;

function toThread(row: ChatThreadRow): ChatThread {
  return {
    id: row.id,
    supplierId: row.supplierId,
    productId: row.productId,
    buyerEmail: row.buyerEmail,
    buyerName: row.buyerName,
    messages: row.messages,
    lastAt: row.lastAt,
  };
}

function threadId(supplierId: string, productId: string, buyerEmail: string): string {
  return `${supplierId}__${productId}__${buyerEmail.toLowerCase().trim()}`;
}

export const chatDb = {
  async getThread(supplierId: string, productId: string, buyerEmail: string): Promise<ChatThread | null> {
    const id = threadId(supplierId, productId, buyerEmail);
    const rows = await drizzleDb.select().from(schema.chatThreads).where(eq(schema.chatThreads.id, id)).limit(1);
    return rows[0] ? toThread(rows[0]) : null;
  },

  async getThreadsForSupplier(supplierId: string): Promise<ChatThread[]> {
    const rows = await drizzleDb.select().from(schema.chatThreads).where(eq(schema.chatThreads.supplierId, supplierId));
    return rows.map(toThread).sort((a, b) => b.lastAt - a.lastAt);
  },

  async getAllThreads(): Promise<ChatThread[]> {
    const rows = await drizzleDb.select().from(schema.chatThreads);
    return rows.map(toThread).sort((a, b) => b.lastAt - a.lastAt);
  },

  async addMessage(
    supplierId: string,
    productId: string,
    buyerEmail: string,
    buyerName: string,
    fromType: 'buyer' | 'supplier',
    content: string
  ): Promise<ChatThread> {
    const id = threadId(supplierId, productId, buyerEmail);
    const msg: ChatMessage = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      fromType,
      content: content.trim(),
      timestamp: Date.now(),
      status: 'pending',
    };
    const now = Date.now();

    const existing = (await drizzleDb.select().from(schema.chatThreads).where(eq(schema.chatThreads.id, id)).limit(1))[0];

    if (!existing) {
      const rows = await drizzleDb.insert(schema.chatThreads).values({
        id,
        supplierId,
        productId,
        buyerEmail: buyerEmail.toLowerCase().trim(),
        buyerName: buyerName.trim(),
        messages: [msg],
        lastAt: now,
      }).returning();
      return toThread(rows[0]);
    }

    const rows = await drizzleDb.update(schema.chatThreads)
      .set({
        messages: [...existing.messages, msg],
        lastAt: now,
        buyerName: buyerName && existing.buyerName !== buyerName.trim() ? buyerName.trim() : existing.buyerName,
      })
      .where(eq(schema.chatThreads.id, id)).returning();
    return toThread(rows[0]);
  },

  async addAdminMessage(threadId: string, content: string): Promise<ChatThread | null> {
    const existing = (await drizzleDb.select().from(schema.chatThreads).where(eq(schema.chatThreads.id, threadId)).limit(1))[0];
    if (!existing) return null;

    const msg: ChatMessage = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      fromType: 'admin',
      content: content.trim(),
      timestamp: Date.now(),
      status: 'approved',
    };

    const rows = await drizzleDb.update(schema.chatThreads)
      .set({ messages: [...existing.messages, msg], lastAt: Date.now() })
      .where(eq(schema.chatThreads.id, threadId)).returning();
    return toThread(rows[0]);
  },

  async reviewMessage(
    threadId: string,
    messageId: string,
    action: 'approve' | 'reject',
    editedContent?: string
  ): Promise<ChatThread | null> {
    const existing = (await drizzleDb.select().from(schema.chatThreads).where(eq(schema.chatThreads.id, threadId)).limit(1))[0];
    if (!existing) return null;

    const messages = existing.messages.map((m) => {
      if (m.id !== messageId) return m;
      const updated = { ...m };
      if (editedContent && editedContent.trim() !== m.content) {
        updated.originalContent = m.content;
        updated.content = editedContent.trim();
      }
      updated.status = action === 'approve' ? 'approved' : 'rejected';
      return updated;
    });
    if (!messages.some((m) => m.id === messageId)) return null;

    const rows = await drizzleDb.update(schema.chatThreads)
      .set({ messages })
      .where(eq(schema.chatThreads.id, threadId)).returning();
    return toThread(rows[0]);
  },
};
