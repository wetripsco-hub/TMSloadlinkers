// ---------- Shared primitives ----------
export type UUID = string;
export type ISODateTime = string;
export type Cents = number; // money in integer cents — never float

export type WorkspaceType = 'freight_brokerage' | 'truck_dispatch' | 'hybrid_enterprise';
export type UserRole =
  | 'org_admin' | 'broker_agent' | 'dispatcher_agent'
  | 'accountant' | 'read_only_viewer';

// ---------- Organization & identity ----------
export interface Organization {
  id: UUID;
  name: string;
  workspaceType: WorkspaceType;
  mcNumber: string | null;
  dotNumber: string | null;
  createdAt: ISODateTime;
  address?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  bankName?: string | null;
  routingNumber?: string | null;
  accountNumber?: string | null;
  remittanceNotes?: string | null;
  logoUrl?: string | null;
}

export interface Profile {
  id: UUID;              // === auth.users.id
  orgId: UUID;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

// ---------- Loads ----------
export type LoadStatus =
  | 'quoted' | 'posted_to_boards' | 'covered' | 'dispatched'
  | 'at_pickup' | 'in_transit' | 'at_delivery'
  | 'delivered' | 'pod_uploaded' | 'invoiced' | 'settled' | 'cancelled';

export interface LoadStop {
  facilityName: string | null;
  address: string | null;
  city: string;
  state: string;
  zip: string;
  windowStart: ISODateTime;
  windowEnd: ISODateTime | null;
}

export interface Load {
  id: UUID;
  orgId: UUID;
  loadNumber: string;
  status: LoadStatus;
  customerId: UUID | null;
  carrierId: UUID | null;
  createdByUserId: UUID | null;

  // dual financial engine
  shipperRate: Cents;
  carrierPay: Cents;
  brokerMargin: Cents;               // derived, read-only from DB
  dispatcherCommissionEarned: Cents;

  equipmentType: string;
  weightLbs: number | null;
  commodity: string | null;
  temperatureSetting: string | null;
  specialInstructions: string | null;
  customerPoNumber: string | null;

  origin: LoadStop;
  destination: LoadStop;

  trackingToken: string;
  driverName: string | null;
  driverPhone: string | null;
  truckNumber: string | null;
  trailerNumber: string | null;
  lastKnownLat: number | null;
  lastKnownLng: number | null;
  lastPingAt: ISODateTime | null;

  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

// ---------- Carriers & compliance ----------
export type ComplianceBadge = 'verified' | 'expiring' | 'blocked' | 'unverified';

export interface Carrier {
  id: UUID;
  orgId: UUID;
  companyName: string;
  dotNumber: string;
  mcNumber: string;
  safetyRating: string;
  authorityStatus: string;
  insuranceCarrierName: string | null;
  insurancePolicyNumber: string | null;
  insuranceExpiryDate: string | null;   // date only
  cargoCoverageLimit: Cents;
  autoLiabilityLimit: Cents;
  isBlacklisted: boolean;
  blacklistReason: string | null;
  isInternalFleet: boolean;
  dispatchFeePercentage: number;
  dispatchFeeFlatWeekly: Cents;
  lastVerifiedAt: ISODateTime | null;
}

export interface CarrierVerificationResult {
  authorityActive: boolean;
  safetyRating: string;
  insuranceOnFile: boolean;
  outOfServiceDate: string | null;
  source: string;             // which provider answered
  fetchedAt: ISODateTime;
  raw: unknown;               // provider payload, stored for audit
  companyName?: string | null;
  physicalAddress?: string | null;
}

export interface CarrierVerificationProvider {
  verify(input: { dotNumber?: string; mcNumber?: string }): Promise<CarrierVerificationResult>;
}

// ---------- Documents & OCR ----------
export type DocumentType =
  | 'POD' | 'BOL' | 'RateConfirmation_Signed'
  | 'Carrier_Invoice' | 'Lumper_Receipt' | 'Scale_Ticket';

export type OcrStatus =
  | 'pending' | 'processing' | 'completed' | 'failed' | 'review_required';

export interface OcrField<T> {
  value: T | null;
  confidence: number;   // 0-100
}

export interface RateConExtraction {
  brokerName: OcrField<string>;
  brokerMcNumber: OcrField<string>;
  agreedRate: OcrField<Cents>;
  originCity: OcrField<string>;
  originState: OcrField<string>;
  destCity: OcrField<string>;
  destState: OcrField<string>;
  pickupWindowStart: OcrField<ISODateTime>;
  deliveryWindowStart: OcrField<ISODateTime>;
  equipmentType: OcrField<string>;
  commodity: OcrField<string>;
  weightLbs: OcrField<number>;
}

export interface PodExtraction {
  signatureDetected: OcrField<boolean>;
  deliveryDateTime: OcrField<ISODateTime>;
  pieceCount: OcrField<number>;
  sealNumber: OcrField<string>;
  exceptionNoted: OcrField<boolean>;
  poNumber: OcrField<string>;
}

export interface LoadDocument {
  id: UUID;
  orgId: UUID;
  loadId: UUID | null;
  documentType: DocumentType;
  fileUrl: string;
  thumbnailUrl: string | null;
  ocrStatus: OcrStatus;
  ocrConfidenceScore: number | null;
  ocrExtractedJson: RateConExtraction | PodExtraction | Record<string, unknown> | null;
  isVerified: boolean;
  verifiedByUserId: UUID | null;
  uploadedAt: ISODateTime;
}

// ---------- Financials ----------
export type InvoiceType =
  | 'shipper_invoice' | 'carrier_settlement_voucher' | 'dispatcher_carrier_commission';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'factored' | 'void';

export interface Invoice {
  id: UUID;
  orgId: UUID;
  loadId: UUID | null;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  billToName: string;
  billToEmail: string | null;
  amountTotal: Cents;
  amountPaid: Cents;
  amountDue: Cents;          // derived
  issueDate: string;
  dueDate: string;
  status: PaymentStatus;
  threeWayMatched: boolean;
  pdfDownloadUrl: string | null;
  customerId?: UUID | null;
  carrierId?: UUID | null;
}

export interface ThreeWayMatchResult {
  matched: boolean;
  agreedCarrierPay: Cents;
  invoicedAmount: Cents;
  variance: Cents;
  podOnFile: boolean;
  reasons: string[];
}
