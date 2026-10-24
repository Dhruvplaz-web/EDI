/**
 * Praxis AI - Indian Localization Formatters (IST, DD/MM/YYYY, INR, Lakh/Crore)
 */

/**
 * Formats a Date into Indian Standard Time (IST, UTC+05:30) with DD/MM/YYYY format.
 */
export function formatDateIndian(dateInput: Date | string | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats time in Indian Standard Time (e.g. "03:30 PM IST").
 */
export function formatTimeIndian(dateInput: Date | string | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const timeStr = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);

  return `${timeStr.toUpperCase()} IST`;
}

/**
 * Formats full datetime in IST (e.g. "24/10/2026, 03:30 PM IST").
 */
export function formatDateTimeIndian(dateInput: Date | string | number): string {
  return `${formatDateIndian(dateInput)}, ${formatTimeIndian(dateInput)}`;
}

/**
 * Formats numbers according to the Indian numbering system (Lakhs and Crores).
 * e.g. 150000 -> "1,50,000"
 */
export function formatNumberIndian(amount: number): string {
  return new Intl.NumberFormat('en-IN').format(amount);
}

/**
 * Formats currency in INR with ₹ symbol and Indian comma notation.
 * e.g. 150000 -> "₹1,50,000"
 * With optional short notation: 15000000 -> "₹1.5 Crore"
 */
export function formatCurrencyIndian(amount: number, useShortWords: boolean = false): string {
  if (useShortWords) {
    if (amount >= 10000000) {
      const crore = Math.round((amount / 10000000) * 100) / 100;
      return `₹${crore} Crore`;
    }
    if (amount >= 100000) {
      const lakh = Math.round((amount / 100000) * 100) / 100;
      return `₹${lakh} Lakh`;
    }
  }

  return `₹${formatNumberIndian(amount)}`;
}
