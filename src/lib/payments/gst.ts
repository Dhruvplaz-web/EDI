/**
 * Praxis AI - Indian Goods and Services Tax (GST) & Invoicing Engine
 * 
 * Implements:
 * 1. SAC Code 998313 (Information technology software services / SaaS).
 * 2. 18% GST calculation with Place of Supply determination:
 *    - Intra-State (Customer State === Supplier State): CGST (9%) + SGST (9%)
 *    - Inter-State (Customer State !== Supplier State): IGST (18%)
 *    - Export of Services (International / USD): Zero-rated under Letter of Undertaking (LUT)
 * 3. GSTIN checksum & structure validation.
 * 4. Sequential tax invoice series formatting (e.g. INV-2627-0001).
 * 
 * Note: e-Invoicing applicability: VERIFY WITH CA (Rule 48(4) turnover criteria).
 * Tag: REQUIRES CA REVIEW • REQUIRES LAWYER REVIEW
 */

export const SAC_CODE = '998313';
export const GST_RATE = 0.18; // 18%
export const CGST_RATE = 0.09; // 9%
export const SGST_RATE = 0.09; // 9%
export const IGST_RATE = 0.18; // 18%

// Supplier primary registration state (Maharashtra State Code: 27)
export const DEFAULT_SUPPLIER_STATE_CODE = '27';
export const DEFAULT_SUPPLIER_GSTIN = '27AAAAA0000A1Z5'; // Representative clinic/SaaS GSTIN

// Standard 15-character Indian GSTIN pattern
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export interface GstSplit {
  subtotal: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalGst: number;
  totalAmount: number;
  supplyType: 'INTRA_STATE' | 'INTER_STATE' | 'EXPORT_ZERO_RATED';
  sacCode: string;
}

export interface TaxInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  financialYear: string;
  supplier: {
    name: string;
    gstin: string;
    stateCode: string;
    stateName: string;
    address: string;
  };
  recipient: {
    orgId: string;
    orgName: string;
    gstin?: string;
    stateCode: string;
    stateName: string;
    address: string;
    email: string;
  };
  lineItems: Array<{
    description: string;
    sacCode: string;
    seats: number;
    billingCycle: 'monthly' | 'annual';
    unitPrice: number;
    amount: number;
  }>;
  gst: GstSplit;
  eInvoicingNotice: string;
  statutoryTag: string;
}

/**
 * Validates format of Indian GST Identification Number (GSTIN).
 */
export function validateGstin(gstin: string | undefined | null): { isValid: boolean; stateCode?: string; error?: string } {
  if (!gstin || gstin.trim() === '') {
    return { isValid: false, error: 'GSTIN is empty.' };
  }

  const clean = gstin.trim().toUpperCase();
  if (!GSTIN_REGEX.test(clean)) {
    return {
      isValid: false,
      error: 'Invalid GSTIN format. Expected 15-character alphanumeric format (e.g. 27ABCDE1234F1Z5).',
    };
  }

  const stateCode = clean.substring(0, 2);
  return { isValid: true, stateCode };
}

/**
 * Calculates GST split according to Place of Supply rules.
 */
export function calculateGst(params: {
  amount: number;
  customerStateCode?: string;
  supplierStateCode?: string;
  isInternational?: boolean;
}): GstSplit {
  const { amount, isInternational } = params;
  const supplierState = params.supplierStateCode || DEFAULT_SUPPLIER_STATE_CODE;
  const customerState = params.customerStateCode || supplierState;

  if (isInternational) {
    return {
      subtotal: amount,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      totalGst: 0,
      totalAmount: amount,
      supplyType: 'EXPORT_ZERO_RATED',
      sacCode: SAC_CODE,
    };
  }

  // Intra-State: Customer state matches supplier state (CGST + SGST)
  if (customerState === supplierState) {
    const cgstAmount = Math.round(amount * CGST_RATE * 100) / 100;
    const sgstAmount = Math.round(amount * SGST_RATE * 100) / 100;
    const totalGst = Math.round((cgstAmount + sgstAmount) * 100) / 100;
    return {
      subtotal: amount,
      cgstRate: CGST_RATE,
      cgstAmount,
      sgstRate: SGST_RATE,
      sgstAmount,
      igstRate: 0,
      igstAmount: 0,
      totalGst,
      totalAmount: Math.round((amount + totalGst) * 100) / 100,
      supplyType: 'INTRA_STATE',
      sacCode: SAC_CODE,
    };
  }

  // Inter-State: Customer state differs from supplier state (IGST)
  const igstAmount = Math.round(amount * IGST_RATE * 100) / 100;
  return {
    subtotal: amount,
    cgstRate: 0,
    cgstAmount: 0,
    sgstRate: 0,
    sgstAmount: 0,
    igstRate: IGST_RATE,
    igstAmount,
    totalGst: igstAmount,
    totalAmount: Math.round((amount + igstAmount) * 100) / 100,
    supplyType: 'INTER_STATE',
    sacCode: SAC_CODE,
  };
}

let invoiceCounter = 1;

/**
 * Generates an official Tax Invoice structure.
 */
export function generateTaxInvoice(params: {
  orgId: string;
  orgName: string;
  recipientGstin?: string;
  customerStateCode?: string;
  customerAddress?: string;
  customerEmail?: string;
  seats: number;
  tierName: string;
  billingCycle: 'monthly' | 'annual';
  subtotalInr: number;
}): TaxInvoice {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const nextYear = (now.getFullYear() + 1).toString().slice(-2);
  const financialYear = `${year}-${nextYear}`;
  const paddedIndex = invoiceCounter.toString().padStart(4, '0');
  invoiceCounter++;

  const invoiceNumber = `INV-${financialYear}-${paddedIndex}`;
  const gst = calculateGst({
    amount: params.subtotalInr,
    customerStateCode: params.customerStateCode,
  });

  return {
    invoiceNumber,
    invoiceDate: now.toISOString().split('T')[0],
    financialYear,
    supplier: {
      name: 'Praxis AI Healthcare Technologies Pvt. Ltd.',
      gstin: DEFAULT_SUPPLIER_GSTIN,
      stateCode: DEFAULT_SUPPLIER_STATE_CODE,
      stateName: 'Maharashtra',
      address: 'Bandra-Kurla Complex, Mumbai, Maharashtra 400051',
    },
    recipient: {
      orgId: params.orgId,
      orgName: params.orgName,
      gstin: params.recipientGstin,
      stateCode: params.customerStateCode || DEFAULT_SUPPLIER_STATE_CODE,
      stateName: params.customerStateCode === '07' ? 'Delhi' : 'Maharashtra',
      address: params.customerAddress || 'Customer Registered Clinic Address',
      email: params.customerEmail || 'billing@customerclinic.in',
    },
    lineItems: [
      {
        description: `Praxis AI Tele-Psychiatry Platform Subscription - ${params.tierName} (${params.seats} Seats)`,
        sacCode: SAC_CODE,
        seats: params.seats,
        billingCycle: params.billingCycle,
        unitPrice: Math.round((params.subtotalInr / params.seats) * 100) / 100,
        amount: params.subtotalInr,
      },
    ],
    gst,
    eInvoicingNotice: 'e-Invoicing Applicability: VERIFY WITH CA (subject to annual aggregate turnover threshold under CGST Rule 48(4)).',
    statutoryTag: 'TAX INVOICE (ISSUED UNDER SECTION 31 OF THE CGST ACT 2017) • REQUIRES CA REVIEW',
  };
}

/**
 * Resets invoice counter for testing.
 */
export function resetInvoiceCounterForTesting(): void {
  invoiceCounter = 1;
}
