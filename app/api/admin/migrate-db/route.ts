import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { isAdminAuthenticated } from '@/lib/auth';
import { drizzleDb } from '@/lib/drizzle';
import * as schema from '@/lib/schema';
import type { Supplier, Buyer } from '@/lib/db';
import type { ChatThread } from '@/lib/chat';
import type { ChatLead } from '@/lib/chat-leads';
import type { LogisticsRequest } from '@/lib/logistics';

// Reads straight from the KV collections (bypassing lib/db.ts etc., which by
// now read/write Postgres) and upserts into Postgres. Idempotent — safe to
// run more than once, e.g. right after the code switch-over to catch any
// writes that landed in KV during the gap between this run and the deploy.
export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [suppliersData, buyersData, threads, leads, logisticsRequests] = await Promise.all([
    kv.get<Supplier[]>('suppliers').then((v) => v ?? []),
    kv.get<Buyer[]>('buyers').then((v) => v ?? []),
    kv.get<ChatThread[]>('chat_threads').then((v) => v ?? []),
    kv.get<ChatLead[]>('chat_leads').then((v) => v ?? []),
    kv.get<LogisticsRequest[]>('logistics_requests').then((v) => v ?? []),
  ]);

  for (const s of suppliersData) {
    const row = {
      id: s.id,
      companyName: s.companyName,
      country: s.country,
      contactName: s.contactName,
      email: s.email,
      phone: s.phone,
      products: s.products,
      annualVolume: s.annualVolume,
      description: s.description,
      elevatorName: s.elevatorName,
      loadingStation: s.loadingStation,
      letterheadUrl: s.letterheadUrl,
      letterheadFileName: s.letterheadFileName,
      letterheadBase64: s.letterheadBase64,
      productPrices: s.productPrices,
      productDetails: s.productDetails,
      status: s.status,
      published: s.published,
      inviteToken: s.inviteToken,
      passwordHash: s.passwordHash,
      createdAt: new Date(s.createdAt),
      updatedAt: new Date(s.updatedAt),
    };
    await drizzleDb.insert(schema.suppliers).values(row)
      .onConflictDoUpdate({ target: schema.suppliers.id, set: row });
  }

  for (const b of buyersData) {
    const row = {
      id: b.id,
      companyName: b.companyName,
      country: b.country,
      registrationNumber: b.registrationNumber,
      legalAddress: b.legalAddress,
      postalAddress: b.postalAddress,
      signatoryName: b.signatoryName,
      signatoryType: b.signatoryType,
      signatoryCustomType: b.signatoryCustomType,
      contactName: b.contactName,
      email: b.email,
      phone: b.phone,
      website: b.website,
      description: b.description,
      bankName: b.bankName,
      swift: b.swift,
      bankAccount: b.bankAccount,
      bankCurrency: b.bankCurrency,
      unloadingRegion: b.unloadingRegion,
      charterDoc: b.charterDoc,
      registrationDoc: b.registrationDoc,
      passportDoc: b.passportDoc,
      passwordHash: b.passwordHash,
      inviteToken: b.inviteToken,
      status: b.status,
      rejectionReason: b.rejectionReason,
      adminNotes: b.adminNotes,
      createdAt: new Date(b.createdAt),
      updatedAt: new Date(b.updatedAt),
    };
    await drizzleDb.insert(schema.buyers).values(row)
      .onConflictDoUpdate({ target: schema.buyers.id, set: row });
  }

  for (const t of threads) {
    const row = {
      id: t.id,
      supplierId: t.supplierId,
      productId: t.productId,
      buyerEmail: t.buyerEmail,
      buyerName: t.buyerName,
      messages: t.messages,
      lastAt: t.lastAt,
    };
    await drizzleDb.insert(schema.chatThreads).values(row)
      .onConflictDoUpdate({ target: schema.chatThreads.id, set: row });
  }

  for (const l of leads) {
    const row = {
      id: l.id,
      status: l.status,
      intent: l.intent,
      product: l.product,
      volume: l.volume,
      contact: l.contact,
      messages: l.messages,
      createdAt: new Date(l.createdAt),
      updatedAt: new Date(l.updatedAt),
    };
    await drizzleDb.insert(schema.chatLeads).values(row)
      .onConflictDoUpdate({ target: schema.chatLeads.id, set: row });
  }

  for (const r of logisticsRequests) {
    const row = {
      id: r.id,
      transportType: r.transportType,
      stationDeparture: r.stationDeparture,
      stationBorder: r.stationBorder,
      stationDestination: r.stationDestination,
      stationEmptyReturn: r.stationEmptyReturn,
      cargoName: r.cargoName,
      cargoCodeGNG: r.cargoCodeGNG,
      cargoCodeETSNG: r.cargoCodeETSNG,
      containerSize: r.containerSize,
      containerCount: r.containerCount,
      wagonCount: r.wagonCount,
      month: r.month,
      decade: r.decade,
      contactName: r.contactName,
      contactCompany: r.contactCompany,
      contactEmail: r.contactEmail,
      contactPhone: r.contactPhone,
      origin: r.origin,
      supplierId: r.supplierId,
      supplierName: r.supplierName,
      buyerId: r.buyerId,
      status: r.status,
      createdAt: new Date(r.createdAt),
    };
    await drizzleDb.insert(schema.logisticsRequests).values(row)
      .onConflictDoUpdate({ target: schema.logisticsRequests.id, set: row });
  }

  return NextResponse.json({
    suppliers: suppliersData.length,
    buyers: buyersData.length,
    chatThreads: threads.length,
    chatLeads: leads.length,
    logisticsRequests: logisticsRequests.length,
  });
}
