import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';

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

const KV_KEY = 'chat_leads';

async function readAll(): Promise<ChatLead[]> {
  return (await kv.get<ChatLead[]>(KV_KEY)) ?? [];
}

async function writeAll(leads: ChatLead[]): Promise<void> {
  await kv.set(KV_KEY, leads);
}

export const chatLeads = {
  async findAll(): Promise<ChatLead[]> {
    const all = await readAll();
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async findById(id: string): Promise<ChatLead | null> {
    return (await readAll()).find((l) => l.id === id) ?? null;
  },

  async create(data: {
    id: string;
    intent: ChatLead['intent'];
    product?: string;
    volume?: string;
    contact: string;
  }): Promise<ChatLead> {
    const all = await readAll();
    const now = new Date().toISOString();
    const lead: ChatLead = {
      ...data,
      status: 'new',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    all.push(lead);
    await writeAll(all);
    return lead;
  },

  async addMessage(id: string, from: 'visitor' | 'admin', content: string): Promise<ChatLead | null> {
    const all = await readAll();
    const idx = all.findIndex((l) => l.id === id);
    if (idx === -1) return null;

    const msg: LeadMessage = {
      id: uuidv4(),
      from,
      content,
      timestamp: new Date().toISOString(),
    };

    all[idx].messages.push(msg);
    all[idx].updatedAt = new Date().toISOString();
    if (from === 'admin' && all[idx].status === 'new') {
      all[idx].status = 'active';
    }

    await writeAll(all);
    return all[idx];
  },

  async updateStatus(id: string, status: ChatLead['status']): Promise<void> {
    const all = await readAll();
    const idx = all.findIndex((l) => l.id === id);
    if (idx === -1) return;
    all[idx].status = status;
    all[idx].updatedAt = new Date().toISOString();
    await writeAll(all);
  },

  async delete(id: string): Promise<void> {
    const all = await readAll();
    await writeAll(all.filter((l) => l.id !== id));
  },
};
