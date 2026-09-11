import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { drizzleDb } from './drizzle';
import * as schema from './schema';

export interface LogisticsRequest {
  id: string;
  transportType: string;
  stationDeparture: string;
  stationBorder: string;
  stationDestination: string;
  stationEmptyReturn?: string;
  cargoName: string;
  cargoCodeGNG?: string;
  cargoCodeETSNG?: string;
  containerSize?: string;
  containerCount?: string;
  wagonCount?: string;
  month: string;
  decade: string;
  contactName: string;
  contactCompany?: string;
  contactEmail: string;
  contactPhone?: string;
  origin: 'public' | 'buyer_dashboard' | 'supplier_dashboard';
  supplierId?: string;
  supplierName?: string;
  buyerId?: string;
  status: 'new' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

type LogisticsRequestRow = typeof schema.logisticsRequests.$inferSelect;

function toRequest(row: LogisticsRequestRow): LogisticsRequest {
  return {
    id: row.id,
    transportType: row.transportType,
    stationDeparture: row.stationDeparture,
    stationBorder: row.stationBorder,
    stationDestination: row.stationDestination,
    stationEmptyReturn: row.stationEmptyReturn ?? undefined,
    cargoName: row.cargoName,
    cargoCodeGNG: row.cargoCodeGNG ?? undefined,
    cargoCodeETSNG: row.cargoCodeETSNG ?? undefined,
    containerSize: row.containerSize ?? undefined,
    containerCount: row.containerCount ?? undefined,
    wagonCount: row.wagonCount ?? undefined,
    month: row.month,
    decade: row.decade,
    contactName: row.contactName,
    contactCompany: row.contactCompany ?? undefined,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone ?? undefined,
    origin: row.origin as LogisticsRequest['origin'],
    supplierId: row.supplierId ?? undefined,
    supplierName: row.supplierName ?? undefined,
    buyerId: row.buyerId ?? undefined,
    status: row.status as LogisticsRequest['status'],
    createdAt: row.createdAt.toISOString(),
  };
}

export const logisticsDb = {
  async findAll(): Promise<LogisticsRequest[]> {
    const rows = await drizzleDb.select().from(schema.logisticsRequests);
    return rows.map(toRequest).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async findByBuyer(buyerId: string): Promise<LogisticsRequest[]> {
    const rows = await drizzleDb.select().from(schema.logisticsRequests).where(eq(schema.logisticsRequests.buyerId, buyerId));
    return rows.map(toRequest).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async findApprovedForSupplier(supplierId: string): Promise<LogisticsRequest[]> {
    const rows = await drizzleDb.select().from(schema.logisticsRequests)
      .where(and(eq(schema.logisticsRequests.supplierId, supplierId), eq(schema.logisticsRequests.status, 'approved')));
    return rows.map(toRequest).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async create(
    data: Omit<LogisticsRequest, 'id' | 'status' | 'createdAt'>
  ): Promise<LogisticsRequest> {
    const rows = await drizzleDb.insert(schema.logisticsRequests).values({
      id: uuidv4(),
      ...data,
      status: data.supplierId ? 'pending' : 'new',
      createdAt: new Date(),
    }).returning();
    return toRequest(rows[0]);
  },

  async review(
    id: string,
    action: 'approve' | 'reject',
    edits?: Partial<LogisticsRequest>
  ): Promise<LogisticsRequest | null> {
    const { id: _id, createdAt: _createdAt, ...safeEdits } = edits ?? {};
    const rows = await drizzleDb.update(schema.logisticsRequests)
      .set({ ...safeEdits, status: action === 'approve' ? 'approved' : 'rejected' })
      .where(eq(schema.logisticsRequests.id, id)).returning();
    return rows[0] ? toRequest(rows[0]) : null;
  },
};
