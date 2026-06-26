import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';

export interface Supplier {
  id: string;
  companyName: string;
  country: string;
  contactName: string;
  email: string;
  phone: string;
  products: string[];
  annualVolume: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

const KV_KEY = 'suppliers';

async function readSuppliers(): Promise<Supplier[]> {
  return (await kv.get<Supplier[]>(KV_KEY)) ?? [];
}

async function writeSuppliers(suppliers: Supplier[]): Promise<void> {
  await kv.set(KV_KEY, suppliers);
}

export const db = {
  suppliers: {
    async findAll(): Promise<Supplier[]> {
      return readSuppliers();
    },

    async findByStatus(status: Supplier['status']): Promise<Supplier[]> {
      return (await readSuppliers()).filter((s) => s.status === status);
    },

    async findById(id: string): Promise<Supplier | undefined> {
      return (await readSuppliers()).find((s) => s.id === id);
    },

    async findByEmail(email: string): Promise<Supplier | undefined> {
      return (await readSuppliers()).find((s) => s.email === email);
    },

    async create(data: Omit<Supplier, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
      const suppliers = await readSuppliers();
      const now = new Date().toISOString();
      const supplier: Supplier = {
        id: uuidv4(),
        ...data,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };
      suppliers.push(supplier);
      await writeSuppliers(suppliers);
      return supplier;
    },

    async updateStatus(id: string, status: Supplier['status']): Promise<Supplier | null> {
      const suppliers = await readSuppliers();
      const idx = suppliers.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      suppliers[idx].status = status;
      suppliers[idx].updatedAt = new Date().toISOString();
      await writeSuppliers(suppliers);
      return suppliers[idx];
    },
  },
};
