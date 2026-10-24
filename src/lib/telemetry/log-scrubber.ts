/**
 * Praxis AI - Application Log & Error Scrubber (DPDP Act 2023 § 8 & CERT-In)
 * 
 * Intercepts console logs, audit messages, and error objects to ensure
 * zero PII (Aadhaar, PAN, Phone, Email) or Clinical PHI (SOAP, transcripts)
 * escapes into logging aggregators or Sentry.
 */

import { scrubPii } from '@/lib/privacy/masking';

export class SafeLogger {
  private static sanitizeArgs(args: unknown[]): unknown[] {
    return args.map((arg) => {
      if (arg instanceof Error) {
        return {
          name: arg.name,
          message: typeof arg.message === 'string' ? scrubPii(arg.message) : 'Error',
          stack: typeof arg.stack === 'string' ? scrubPii(arg.stack) : undefined,
        };
      }
      return scrubPii(arg);
    });
  }

  static info(message: string, ...args: unknown[]): void {
    const cleanMsg = scrubPii(message) as string;
    const cleanArgs = this.sanitizeArgs(args);
    console.log(`[INFO] ${cleanMsg}`, ...cleanArgs);
  }

  static warn(message: string, ...args: unknown[]): void {
    const cleanMsg = scrubPii(message) as string;
    const cleanArgs = this.sanitizeArgs(args);
    console.warn(`[WARN] ${cleanMsg}`, ...cleanArgs);
  }

  static error(message: string, ...args: unknown[]): void {
    const cleanMsg = scrubPii(message) as string;
    const cleanArgs = this.sanitizeArgs(args);
    console.error(`[ERROR] ${cleanMsg}`, ...cleanArgs);
  }

  /**
   * Sentry beforeSend hook to scrub breadcrumbs and event payloads.
   */
  static sentryBeforeSend<T extends Record<string, unknown>>(event: T): T {
    return scrubPii(event) as T;
  }
}
