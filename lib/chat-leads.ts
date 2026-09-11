import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { drizzleDb } from './drizzle';
import * as schema from './schema';

export interface LeadMessage {
  id: string;
  from: 'visitor' | 'admin';
  content: string;
  timestamp: string;
}

export interface ChatLead {
  id: string;
  status: 'new' | 'active' | 'closed';
  intent: 'buyer' | 'supplier' | 'other';
  product?: string;
  volume?: string;
  contact: string;
  messages: LeadMessage[];
  createdAt: string;
  updatedAt: string;
}

type ChatLeadRow = typeof schema.chatLeads.$inferSelect;

function toLead(row: ChatLeadRow): ChatLead {
  return {
    id: row.id,
    status: row.status as ChatLead['status'],
    intent: row.intent as ChatLead['intent'],
    product: row.product ?? undefined,
    volume: row.volume ?? undefined,
    contact: row.contact,
    messages: row.messages,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const chatLeads = {
  async findAll(): Promise<ChatLead[]> {
    const rows = await drizzleDb.select().from(schema.chatLeads);
    return rows.map(toLead).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async findById(id: string): Promise<ChatLead | null> {
    const rows = await drizzleDb.select().from(schema.chatLeads).where(eq(schema.chatLeads.id, id)).limit(1);
    return rows[0] ? toLead(rows[0]) : null;
  },

  async create(data: {
    id: string;
    intent: ChatLead['intent'];
    product?: string;
    volume?: string;
    contact: string;
  }): Promise<ChatLead> {
    const now = new Date();
    const rows = await drizzleDb.insert(schema.chatLeads).values({
      id: data.id,
      intent: data.intent,
      product: data.product,
      volume: data.volume,
      contact: data.contact,
      status: 'new',
      messages: [],
      createdAt: now,
      updatedAt: now,
    }).returning();
    return toLead(rows[0]);
  },

  async addMessage(id: string, from: 'visitor' | 'admin', content: string): Promise<ChatLead | null> {
    const existing = (await drizzleDb.select().from(schema.chatLeads).where(eq(schema.chatLeads.id, id)).limit(1))[0];
    if (!existing) return null;

    const msg: LeadMessage = {
      id: uuidv4(),
      from,
      content,
      timestamp: new Date().toISOString(),
    };

    const rows = await drizzleDb.update(schema.chatLeads)
      .set({
        messages: [...existing.messages, msg],
        updatedAt: new Date(),
        status: from === 'admin' && existing.status === 'new' ? 'active' : existing.status,
      })
      .where(eq(schema.chatLeads.id, id)).returning();
    return toLead(rows[0]);
  },

  async updateStatus(id: string, status: ChatLead['status']): Promise<void> {
    await drizzleDb.update(schema.chatLeads)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.chatLeads.id, id));
  },

  async delete(id: string): Promise<void> {
    await drizzleDb.delete(schema.chatLeads).where(eq(schema.chatLeads.id, id));
  },
};
