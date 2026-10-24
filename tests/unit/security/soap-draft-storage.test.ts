import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveSoapDraft,
  loadSoapDraft,
  clearSoapDraft,
  purgeAllSoapDraftsOnLogoutOrIdle,
  SOAP_DRAFT_PREFIX
} from '@/lib/clinical/soap-draft-storage';

describe('SOAP Draft Storage Security (DPDP Health Data-at-Rest Protection)', () => {
  const patientId = 'patient_pt_99214_alice';
  const sampleSoap = {
    subjective: 'Patient reports mild social anxiety and fatigue.',
    objective: 'Affect congruent, speech rate normal.',
    assessment: 'Generalized Anxiety Disorder (F41.1)',
    plan: 'Continue CBT, follow-up in 2 weeks.'
  };

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('stores drafts exclusively in sessionStorage and NEVER in localStorage', () => {
    saveSoapDraft(patientId, sampleSoap);

    // Assert sessionStorage contains the draft
    const inSession = sessionStorage.getItem(`${SOAP_DRAFT_PREFIX}${patientId}`);
    expect(inSession).toBeTruthy();
    expect(JSON.parse(inSession!)).toEqual(sampleSoap);

    // Assert localStorage is 100% untouched to prevent persistent PHI leaks on disk
    expect(localStorage.getItem(`${SOAP_DRAFT_PREFIX}${patientId}`)).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('loads drafts from sessionStorage correctly', () => {
    sessionStorage.setItem(`${SOAP_DRAFT_PREFIX}${patientId}`, JSON.stringify(sampleSoap));
    const loaded = loadSoapDraft(patientId);
    expect(loaded).toEqual(sampleSoap);
  });

  it('purges any legacy drafts from localStorage immediately upon detection', () => {
    // Deliberately seed a legacy insecure localStorage entry
    localStorage.setItem(`${SOAP_DRAFT_PREFIX}${patientId}`, JSON.stringify(sampleSoap));

    // Calling loadSoapDraft must purge the insecure localStorage entry
    loadSoapDraft(patientId);
    expect(localStorage.getItem(`${SOAP_DRAFT_PREFIX}${patientId}`)).toBeNull();
  });

  it('clearSoapDraft removes draft from sessionStorage upon note signing', () => {
    saveSoapDraft(patientId, sampleSoap);
    expect(sessionStorage.getItem(`${SOAP_DRAFT_PREFIX}${patientId}`)).toBeTruthy();

    clearSoapDraft(patientId);
    expect(sessionStorage.getItem(`${SOAP_DRAFT_PREFIX}${patientId}`)).toBeNull();
  });

  it('purgeAllSoapDraftsOnLogoutOrIdle clears all drafts across all patients on logout or idle', () => {
    saveSoapDraft('pt_1', sampleSoap);
    saveSoapDraft('pt_2', sampleSoap);
    sessionStorage.setItem('other_app_pref', 'dark_theme');

    expect(sessionStorage.getItem(`${SOAP_DRAFT_PREFIX}pt_1`)).toBeTruthy();
    expect(sessionStorage.getItem(`${SOAP_DRAFT_PREFIX}pt_2`)).toBeTruthy();

    purgeAllSoapDraftsOnLogoutOrIdle();

    expect(sessionStorage.getItem(`${SOAP_DRAFT_PREFIX}pt_1`)).toBeNull();
    expect(sessionStorage.getItem(`${SOAP_DRAFT_PREFIX}pt_2`)).toBeNull();
    // Non-draft keys should be preserved or handled appropriately
    expect(sessionStorage.getItem('other_app_pref')).toBe('dark_theme');
  });
});
