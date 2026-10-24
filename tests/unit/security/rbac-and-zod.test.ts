import { describe, it, expect } from 'vitest';
import { hasPermission } from '@/lib/config/permissions';
import { validateTenantAccess, assertClinicalDataIsolation } from '@/lib/tenant/context';

describe('Security RBAC & Multi-Tenant Boundary Verification', () => {
  describe('RBAC Permission Matrix', () => {
    it('allows clinician to view triage queue, write notes, and view sensitive notes', () => {
      expect(hasPermission('clinician', 'view_triage_queue')).toBe(true);
      expect(hasPermission('clinician', 'write_standard_notes')).toBe(true);
      expect(hasPermission('clinician', 'view_sensitive_notes')).toBe(true);
      expect(hasPermission('clinician', 'order_diagnostics')).toBe(true);
    });

    it('prohibits patients from viewing clinician notes or managing roles', () => {
      expect(hasPermission('patient', 'write_standard_notes')).toBe(false);
      expect(hasPermission('patient', 'manage_rbac_assignments')).toBe(false);
      expect(hasPermission('patient', 'perform_system_override')).toBe(false);
    });

    it('prohibits billing admin from viewing clinical notes or prescribing', () => {
      expect(hasPermission('billing_admin', 'write_standard_notes')).toBe(false);
      expect(hasPermission('billing_admin', 'prescribe_standard_medication')).toBe(false);
      expect(hasPermission('billing_admin', 'view_sensitive_notes')).toBe(false);
    });

    it('allows super_admin full administrative access across boundaries', () => {
      expect(hasPermission('super_admin', 'manage_rbac_assignments')).toBe(true);
      expect(hasPermission('super_admin', 'perform_system_override')).toBe(true);
    });
  });

  describe('Multi-Tenant Data Isolation', () => {
    it('permits access when user orgId matches record targetOrgId', () => {
      const clinicianContext = {
        orgId: 'org_metro_psych',
        userId: 'usr_clinician_1',
        role: 'clinician' as const,
        isDemo: false
      };

      expect(validateTenantAccess(clinicianContext, 'org_metro_psych')).toBe(true);
      expect(validateTenantAccess(clinicianContext, 'org_valley_health')).toBe(false);
    });

    it('allows super_admin to inspect cross-tenant records for platform maintenance', () => {
      const adminContext = {
        orgId: 'org_platform_root',
        userId: 'usr_admin_1',
        role: 'super_admin' as const,
        isDemo: false
      };

      expect(validateTenantAccess(adminContext, 'org_valley_health')).toBe(true);
      expect(validateTenantAccess(adminContext, 'org_metro_psych')).toBe(true);
    });

    it('throws security violation if synthetic demo records are injected into a production tenant', () => {
      expect(() => {
        assertClinicalDataIsolation(true, false);
      }).toThrow('Security Violation');
    });

    it('allows demo records under the designated DEMO tenant partition', () => {
      expect(() => {
        assertClinicalDataIsolation(true, true);
      }).not.toThrow();
    });
  });
});
