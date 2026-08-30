import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';

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

const KV_KEY = 'logistics_requests';

async function read(): Promise<LogisticsRequest[]> {
  return (await kv.get<LogisticsRequest[]>(KV_KEY)) ?? [];
}

async function write(requests: LogisticsRequest[]): Promise<void> {
  await kv.set(KV_KEY, requests);
}

export const logisticsDb = {
  async findAll(): Promise<LogisticsRequest[]> {
    return (await read()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async findByBuyer(buyerId: string): Promise<LogisticsRequest[]> {
    return (await logisticsDb.findAll()).filter((r) => r.buyerId === buyerId);
  },

  async findApprovedForSupplier(supplierId: string): Promise<LogisticsRequest[]> {
    return (await logisticsDb.findAll()).filter((r) => r.supplierId === supplierId && r.status === 'approved');
  },

  async create(
    data: Omit<LogisticsRequest, 'id' | 'status' | 'createdAt'>
  ): Promise<LogisticsRequest> {
    const requests = await read();
    const request: LogisticsRequest = {
      id: uuidv4(),
      ...data,
      status: data.supplierId ? 'pending' : 'new',
      createdAt: new Date().toISOString(),
    };
    requests.push(request);
    await write(requests);
    return request;
  },

  async review(
    id: string,
    action: 'approve' | 'reject',
    edits?: Partial<LogisticsRequest>
  ): Promise<LogisticsRequest | null> {
    const requests = await read();
    const idx = requests.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    requests[idx] = {
      ...requests[idx],
      ...edits,
      status: action === 'approve' ? 'approved' : 'rejected',
    };
    await write(requests);
    return requests[idx];
  },
};
