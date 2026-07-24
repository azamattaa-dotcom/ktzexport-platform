import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';

export interface BuyerDocument {
  base64: string;
  fileName: string;
  fileType: string;
}

export interface Buyer {
  id: string;
  // Company
  companyName: string;
  country: string;
  registrationNumber: string;
  address: string;
  directorName: string;
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  description?: string;
  // Documents
  charterDoc?: BuyerDocument;
  registrationDoc?: BuyerDocument;
  passportDoc?: BuyerDocument;
  // Auth
  passwordHash?: string;
  inviteToken?: string;
  // Status
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductPrice {
  type: 'fixed' | 'range';
  fixed?: number;
  min?: number;
  max?: number;
  currency: 'USD' | 'KZT';
  unit: string;
}

export interface ProductDetail {
  price?: ProductPrice;
  availableVolume?: string;
  minOrder?: string;
  characteristics?: string;
  certificateBase64?: string;
  certificateFileName?: string;
}

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
  elevatorName: string;
  loadingStation?: string;
  letterheadBase64?: string;
  letterheadFileName?: string;
  productPrices?: Record<string, ProductPrice>;
  productDetails?: Record<string, ProductDetail>;
  status: 'pending' | 'approved' | 'rejected';
  inviteToken?: string;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
}

const KV_KEY = 'suppliers';
const BUYERS_KEY = 'buyers';

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

    async create(
      data: Omit<Supplier, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'inviteToken' | 'passwordHash'>,
      opts?: { status?: Supplier['status']; passwordHash?: string }
    ): Promise<Supplier> {
      const suppliers = await readSuppliers();
      const now = new Date().toISOString();
      const supplier: Supplier = {
        id: uuidv4(),
        ...data,
        status: opts?.status ?? 'pending',
        createdAt: now,
        updatedAt: now,
      };
      if (opts?.passwordHash) supplier.passwordHash = opts.passwordHash;
      suppliers.push(supplier);
      await writeSuppliers(suppliers);
      return supplier;
    },

    async updateStatus(id: string, status: Supplier['status'], inviteToken?: string): Promise<Supplier | null> {
      const suppliers = await readSuppliers();
      const idx = suppliers.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      suppliers[idx].status = status;
      suppliers[idx].updatedAt = new Date().toISOString();
      if (inviteToken) suppliers[idx].inviteToken = inviteToken;
      await writeSuppliers(suppliers);
      return suppliers[idx];
    },

    async updateProductDetails(id: string, productDetails: Record<string, ProductDetail>): Promise<Supplier | null> {
      const suppliers = await readSuppliers();
      const idx = suppliers.findIndex((s) => s.id === id);
      if (idx === -1) return null;
      suppliers[idx].productDetails = productDetails;
      suppliers[idx].updatedAt = new Date().toISOString();
      await writeSuppliers(suppliers);
      return suppliers[idx];
    },

    async findByInviteToken(token: string): Promise<Supplier | undefined> {
      return (await readSuppliers()).find((s) => s.inviteToken === token);
    },

    async setPassword(id: string, passwordHash: string): Promise<void> {
      const suppliers = await readSuppliers();
      const idx = suppliers.findIndex((s) => s.id === id);
      if (idx === -1) return;
      suppliers[idx].passwordHash = passwordHash;
      suppliers[idx].inviteToken = undefined;
      suppliers[idx].updatedAt = new Date().toISOString();
      await writeSuppliers(suppliers);
    },

    async delete(id: string): Promise<boolean> {
      const suppliers = await readSuppliers();
      const idx = suppliers.findIndex((s) => s.id === id);
      if (idx === -1) return false;
      suppliers.splice(idx, 1);
      await writeSuppliers(suppliers);
      return true;
    },
  },

  buyers: {
    async findAll(): Promise<Buyer[]> {
      return (await kv.get<Buyer[]>(BUYERS_KEY)) ?? [];
    },

    async findById(id: string): Promise<Buyer | undefined> {
      return (await db.buyers.findAll()).find((b) => b.id === id);
    },

    async findByEmail(email: string): Promise<Buyer | undefined> {
      return (await db.buyers.findAll()).find((b) => b.email === email);
    },

    async findByInviteToken(token: string): Promise<Buyer | undefined> {
      return (await db.buyers.findAll()).find((b) => b.inviteToken === token);
    },

    async create(data: Omit<Buyer, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'inviteToken' | 'passwordHash'>): Promise<Buyer> {
      const all = await db.buyers.findAll();
      const now = new Date().toISOString();
      const buyer: Buyer = { id: uuidv4(), ...data, status: 'pending', createdAt: now, updatedAt: now };
      all.push(buyer);
      await kv.set(BUYERS_KEY, all);
      return buyer;
    },

    async update(id: string, patch: Partial<Buyer>): Promise<Buyer | null> {
      const all = await db.buyers.findAll();
      const idx = all.findIndex((b) => b.id === id);
      if (idx === -1) return null;
      all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
      await kv.set(BUYERS_KEY, all);
      return all[idx];
    },

    async setPassword(id: string, passwordHash: string): Promise<void> {
      await db.buyers.update(id, { passwordHash, inviteToken: undefined });
    },

    async delete(id: string): Promise<boolean> {
      const all = await db.buyers.findAll();
      const idx = all.findIndex((b) => b.id === id);
      if (idx === -1) return false;
      all.splice(idx, 1);
      await kv.set(BUYERS_KEY, all);
      return true;
    },
  },
};
