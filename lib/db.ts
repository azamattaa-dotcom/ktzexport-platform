import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { drizzleDb } from './drizzle';
import * as schema from './schema';

export interface BuyerDocument {
  url?: string;
  fileName: string;
  fileType: string;
  /** @deprecated pre-Blob-migration shape — data URI. Read as a fallback only; new writes never set this. */
  base64?: string;
}

export interface Buyer {
  id: string;
  // Company
  companyName: string;
  country: string;
  registrationNumber: string;   // БИН / ИНН / USCC / Tax ID
  legalAddress: string;
  postalAddress: string;
  // Signatory
  signatoryName: string;        // ФИО подписанта
  signatoryType: string;        // Директор | Генеральный директор | Законный представитель | custom
  signatoryCustomType?: string; // если тип = "other"
  // Contact
  contactName: string;
  email: string;
  phone: string;
  website?: string;
  description?: string;
  // Banking
  bankName: string;
  swift: string;
  bankAccount: string;
  bankCurrency: string;
  // Logistics
  unloadingRegion: string;
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
  certificateUrl?: string;
  certificateFileName?: string;
  /** @deprecated pre-Blob-migration shape — data URI. Read as a fallback only; new writes never set this. */
  certificateBase64?: string;
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
  letterheadUrl?: string;
  letterheadFileName?: string;
  /** @deprecated pre-Blob-migration shape — data URI. Read as a fallback only; new writes never set this. */
  letterheadBase64?: string;
  productPrices?: Record<string, ProductPrice>;
  productDetails?: Record<string, ProductDetail>;
  status: 'pending' | 'approved' | 'rejected';
  published: boolean;
  inviteToken?: string;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
}

type SupplierRow = typeof schema.suppliers.$inferSelect;
type BuyerRow = typeof schema.buyers.$inferSelect;

// Callers clear a field by setting it to `undefined` (matches the old KV/JSON
// behavior, where an explicit `undefined` drops the key on serialize). Drizzle's
// `.set()` treats `undefined` as "leave this column alone", so a key that's
// explicitly present with value `undefined` must become `null` to actually clear
// the column — keys that are simply absent from `patch` stay untouched either way.
function patchToSetValues<T extends Record<string, unknown>>(patch: Partial<T>): Record<string, unknown> {
  const setValues: Record<string, unknown> = {};
  for (const key of Object.keys(patch)) {
    const value = patch[key];
    setValues[key] = value === undefined ? null : value;
  }
  return setValues;
}

function toSupplier(row: SupplierRow): Supplier {
  return {
    id: row.id,
    companyName: row.companyName,
    country: row.country,
    contactName: row.contactName,
    email: row.email,
    phone: row.phone,
    products: row.products,
    annualVolume: row.annualVolume,
    description: row.description,
    elevatorName: row.elevatorName,
    loadingStation: row.loadingStation ?? undefined,
    letterheadUrl: row.letterheadUrl ?? undefined,
    letterheadFileName: row.letterheadFileName ?? undefined,
    letterheadBase64: row.letterheadBase64 ?? undefined,
    productPrices: row.productPrices ?? undefined,
    productDetails: row.productDetails ?? undefined,
    status: row.status as Supplier['status'],
    published: row.published,
    inviteToken: row.inviteToken ?? undefined,
    passwordHash: row.passwordHash ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toBuyer(row: BuyerRow): Buyer {
  return {
    id: row.id,
    companyName: row.companyName,
    country: row.country,
    registrationNumber: row.registrationNumber,
    legalAddress: row.legalAddress,
    postalAddress: row.postalAddress,
    signatoryName: row.signatoryName,
    signatoryType: row.signatoryType,
    signatoryCustomType: row.signatoryCustomType ?? undefined,
    contactName: row.contactName,
    email: row.email,
    phone: row.phone,
    website: row.website ?? undefined,
    description: row.description ?? undefined,
    bankName: row.bankName,
    swift: row.swift,
    bankAccount: row.bankAccount,
    bankCurrency: row.bankCurrency,
    unloadingRegion: row.unloadingRegion,
    charterDoc: row.charterDoc ?? undefined,
    registrationDoc: row.registrationDoc ?? undefined,
    passportDoc: row.passportDoc ?? undefined,
    passwordHash: row.passwordHash ?? undefined,
    inviteToken: row.inviteToken ?? undefined,
    status: row.status as Buyer['status'],
    rejectionReason: row.rejectionReason ?? undefined,
    adminNotes: row.adminNotes ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const db = {
  suppliers: {
    async findAll(): Promise<Supplier[]> {
      const rows = await drizzleDb.select().from(schema.suppliers);
      return rows.map(toSupplier);
    },

    async findByStatus(status: Supplier['status']): Promise<Supplier[]> {
      const rows = await drizzleDb.select().from(schema.suppliers).where(eq(schema.suppliers.status, status));
      return rows.map(toSupplier);
    },

    async findById(id: string): Promise<Supplier | undefined> {
      const rows = await drizzleDb.select().from(schema.suppliers).where(eq(schema.suppliers.id, id)).limit(1);
      return rows[0] ? toSupplier(rows[0]) : undefined;
    },

    async findByEmail(email: string): Promise<Supplier | undefined> {
      const rows = await drizzleDb.select().from(schema.suppliers).where(eq(schema.suppliers.email, email)).limit(1);
      return rows[0] ? toSupplier(rows[0]) : undefined;
    },

    async create(
      data: Omit<Supplier, 'id' | 'status' | 'published' | 'createdAt' | 'updatedAt' | 'inviteToken' | 'passwordHash'>,
      opts?: { status?: Supplier['status']; published?: boolean; passwordHash?: string }
    ): Promise<Supplier> {
      const now = new Date();
      const rows = await drizzleDb.insert(schema.suppliers).values({
        id: uuidv4(),
        ...data,
        status: opts?.status ?? 'pending',
        published: opts?.published ?? false,
        passwordHash: opts?.passwordHash,
        createdAt: now,
        updatedAt: now,
      }).returning();
      return toSupplier(rows[0]);
    },

    async updateStatus(id: string, status: Supplier['status'], inviteToken?: string): Promise<Supplier | null> {
      const patch: Partial<SupplierRow> = { status, updatedAt: new Date() };
      if (inviteToken) patch.inviteToken = inviteToken;
      const rows = await drizzleDb.update(schema.suppliers).set(patch).where(eq(schema.suppliers.id, id)).returning();
      return rows[0] ? toSupplier(rows[0]) : null;
    },

    async updateProductDetails(id: string, productDetails: Record<string, ProductDetail>): Promise<Supplier | null> {
      const rows = await drizzleDb.update(schema.suppliers)
        .set({ productDetails, updatedAt: new Date() })
        .where(eq(schema.suppliers.id, id)).returning();
      return rows[0] ? toSupplier(rows[0]) : null;
    },

    async update(id: string, patch: Partial<Omit<Supplier, 'id' | 'createdAt'>>): Promise<Supplier | null> {
      const rows = await drizzleDb.update(schema.suppliers)
        .set({ ...patchToSetValues(patch), updatedAt: new Date() })
        .where(eq(schema.suppliers.id, id)).returning();
      return rows[0] ? toSupplier(rows[0]) : null;
    },

    async findByInviteToken(token: string): Promise<Supplier | undefined> {
      const rows = await drizzleDb.select().from(schema.suppliers).where(eq(schema.suppliers.inviteToken, token)).limit(1);
      return rows[0] ? toSupplier(rows[0]) : undefined;
    },

    async setPassword(id: string, passwordHash: string): Promise<void> {
      await drizzleDb.update(schema.suppliers)
        .set({ passwordHash, inviteToken: null, updatedAt: new Date() })
        .where(eq(schema.suppliers.id, id));
    },

    async delete(id: string): Promise<boolean> {
      const rows = await drizzleDb.delete(schema.suppliers).where(eq(schema.suppliers.id, id)).returning({ id: schema.suppliers.id });
      return rows.length > 0;
    },
  },

  buyers: {
    async findAll(): Promise<Buyer[]> {
      const rows = await drizzleDb.select().from(schema.buyers);
      return rows.map(toBuyer);
    },

    async findById(id: string): Promise<Buyer | undefined> {
      const rows = await drizzleDb.select().from(schema.buyers).where(eq(schema.buyers.id, id)).limit(1);
      return rows[0] ? toBuyer(rows[0]) : undefined;
    },

    async findByEmail(email: string): Promise<Buyer | undefined> {
      const rows = await drizzleDb.select().from(schema.buyers).where(eq(schema.buyers.email, email)).limit(1);
      return rows[0] ? toBuyer(rows[0]) : undefined;
    },

    async findByInviteToken(token: string): Promise<Buyer | undefined> {
      const rows = await drizzleDb.select().from(schema.buyers).where(eq(schema.buyers.inviteToken, token)).limit(1);
      return rows[0] ? toBuyer(rows[0]) : undefined;
    },

    async create(data: Omit<Buyer, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'inviteToken' | 'passwordHash'>): Promise<Buyer> {
      const now = new Date();
      const rows = await drizzleDb.insert(schema.buyers).values({
        id: uuidv4(),
        ...data,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      }).returning();
      return toBuyer(rows[0]);
    },

    async update(id: string, patch: Partial<Buyer>): Promise<Buyer | null> {
      const rows = await drizzleDb.update(schema.buyers)
        .set({ ...patchToSetValues(patch), updatedAt: new Date() })
        .where(eq(schema.buyers.id, id)).returning();
      return rows[0] ? toBuyer(rows[0]) : null;
    },

    async setPassword(id: string, passwordHash: string): Promise<void> {
      await db.buyers.update(id, { passwordHash, inviteToken: undefined });
    },

    async delete(id: string): Promise<boolean> {
      const rows = await drizzleDb.delete(schema.buyers).where(eq(schema.buyers.id, id)).returning({ id: schema.buyers.id });
      return rows.length > 0;
    },
  },
};
