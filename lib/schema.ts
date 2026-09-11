import { pgTable, text, boolean, timestamp, bigint, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';
import type { ProductPrice, ProductDetail, BuyerDocument } from './db';
import type { ChatMessage } from './chat';
import type { LeadMessage } from './chat-leads';

export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey(),
  companyName: text('company_name').notNull(),
  country: text('country').notNull(),
  contactName: text('contact_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  products: text('products').array().notNull(),
  annualVolume: text('annual_volume').notNull(),
  description: text('description').notNull().default(''),
  elevatorName: text('elevator_name').notNull().default(''),
  loadingStation: text('loading_station'),
  letterheadUrl: text('letterhead_url'),
  letterheadFileName: text('letterhead_file_name'),
  letterheadBase64: text('letterhead_base64'), // deprecated pre-Blob fallback
  productPrices: jsonb('product_prices').$type<Record<string, ProductPrice>>(),
  productDetails: jsonb('product_details').$type<Record<string, ProductDetail>>(),
  status: text('status').notNull(), // 'pending' | 'approved' | 'rejected'
  published: boolean('published').notNull().default(false),
  inviteToken: text('invite_token'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
}, (t) => ({
  emailIdx: uniqueIndex('suppliers_email_idx').on(t.email),
  statusIdx: index('suppliers_status_idx').on(t.status),
}));

export const buyers = pgTable('buyers', {
  id: text('id').primaryKey(),
  companyName: text('company_name').notNull(),
  country: text('country').notNull(),
  registrationNumber: text('registration_number').notNull(),
  legalAddress: text('legal_address').notNull(),
  postalAddress: text('postal_address').notNull(),
  signatoryName: text('signatory_name').notNull(),
  signatoryType: text('signatory_type').notNull(),
  signatoryCustomType: text('signatory_custom_type'),
  contactName: text('contact_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  website: text('website'),
  description: text('description'),
  bankName: text('bank_name').notNull(),
  swift: text('swift').notNull(),
  bankAccount: text('bank_account').notNull(),
  bankCurrency: text('bank_currency').notNull(),
  unloadingRegion: text('unloading_region').notNull(),
  charterDoc: jsonb('charter_doc').$type<BuyerDocument>(),
  registrationDoc: jsonb('registration_doc').$type<BuyerDocument>(),
  passportDoc: jsonb('passport_doc').$type<BuyerDocument>(),
  passwordHash: text('password_hash'),
  inviteToken: text('invite_token'),
  status: text('status').notNull(),
  rejectionReason: text('rejection_reason'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
}, (t) => ({
  emailIdx: uniqueIndex('buyers_email_idx').on(t.email),
  statusIdx: index('buyers_status_idx').on(t.status),
}));

export const chatThreads = pgTable('chat_threads', {
  id: text('id').primaryKey(), // `${supplierId}__${productId}__${buyerEmail}`
  supplierId: text('supplier_id').notNull(),
  productId: text('product_id').notNull(),
  buyerEmail: text('buyer_email').notNull(),
  buyerName: text('buyer_name').notNull(),
  messages: jsonb('messages').$type<ChatMessage[]>().notNull().default([]),
  lastAt: bigint('last_at', { mode: 'number' }).notNull(), // epoch ms, matches Date.now()
}, (t) => ({
  supplierIdx: index('chat_threads_supplier_idx').on(t.supplierId),
}));

export const chatLeads = pgTable('chat_leads', {
  id: text('id').primaryKey(),
  status: text('status').notNull(), // 'new' | 'active' | 'closed'
  intent: text('intent').notNull(), // 'buyer' | 'supplier' | 'other'
  product: text('product'),
  volume: text('volume'),
  contact: text('contact').notNull(),
  messages: jsonb('messages').$type<LeadMessage[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const logisticsRequests = pgTable('logistics_requests', {
  id: text('id').primaryKey(),
  transportType: text('transport_type').notNull(),
  stationDeparture: text('station_departure').notNull(),
  stationBorder: text('station_border').notNull(),
  stationDestination: text('station_destination').notNull(),
  stationEmptyReturn: text('station_empty_return'),
  cargoName: text('cargo_name').notNull(),
  cargoCodeGNG: text('cargo_code_gng'),
  cargoCodeETSNG: text('cargo_code_etsng'),
  containerSize: text('container_size'),
  containerCount: text('container_count'),
  wagonCount: text('wagon_count'),
  month: text('month').notNull(),
  decade: text('decade').notNull(),
  contactName: text('contact_name').notNull(),
  contactCompany: text('contact_company'),
  contactEmail: text('contact_email').notNull(),
  contactPhone: text('contact_phone'),
  origin: text('origin').notNull(), // 'public' | 'buyer_dashboard' | 'supplier_dashboard'
  supplierId: text('supplier_id'),
  supplierName: text('supplier_name'),
  buyerId: text('buyer_id'),
  status: text('status').notNull(), // 'new' | 'pending' | 'approved' | 'rejected'
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
}, (t) => ({
  supplierIdx: index('logistics_requests_supplier_idx').on(t.supplierId),
  buyerIdx: index('logistics_requests_buyer_idx').on(t.buyerId),
}));
