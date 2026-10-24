import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLiveTranscription, TranscriptionEngineMode } from '@/hooks/useLiveTranscription';

describe('C.3: Speech Privacy Gate - webkitSpeechRecognition Disabled by Default', () => {
  let mockRecognitionConstructor: ReturnType<typeof vi.fn>;
  let mockRecognitionInstance: {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => void) | null;
    onresult: ((event: unknown) => void) | null;
    onerror: ((event: unknown) => void) | null;
    onend: (() => void) | null;
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    mockRecognitionInstance = {
      start: vi.fn(),
      stop: vi.fn(),
      continuous: false,
      interimResults: false,
      lang: 'en-US',
      onstart: null,
      onresult: null,
      onerror: null,
      onend: null,
    };

    mockRecognitionConstructor = vi.fn().mockImplementation(function() {
      return mockRecognitionInstance;
    });

    // Mock both vendor-prefixed and standard Web Speech API
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = mockRecognitionConstructor;
    (window as unknown as Record<string, unknown>).SpeechRecognition = mockRecognitionConstructor;
  });

  it('defaults transcription engine to "disabled" and does not instantiate SpeechRecognition', () => {
    const { result } = renderHook(() => useLiveTranscription(true));

    expect(result.current.engineMode).toBe('disabled');
    expect(result.current.isListening).toBe(false);
    expect(mockRecognitionConstructor).not.toHaveBeenCalled();
  });

  it('calling startTranscription() when disabled does not trigger browser cloud speech egress', () => {
    const { result } = renderHook(() => useLiveTranscription(true, false, 'disabled'));

    act(() => {
      result.current.startTranscription();
    });

    expect(result.current.isListening).toBe(false);
    expect(mockRecognitionConstructor).not.toHaveBeenCalled();
    expect(mockRecognitionInstance.start).not.toHaveBeenCalled();
  });

  it('only instantiates SpeechRecognition when explicitly opted into "browser_cloud_opt_in" with consent', () => {
    const { result } = renderHook(() => useLiveTranscription(true, false, 'browser_cloud_opt_in'));

    expect(result.current.engineMode).toBe('browser_cloud_opt_in');

    act(() => {
      result.current.startTranscription();
    });

    expect(mockRecognitionConstructor).toHaveBeenCalled();
    expect(mockRecognitionInstance.start).toHaveBeenCalled();
  });

  it('provides "on_device_wasm" mode that processes utterances locally without cloud SpeechRecognition', () => {
    const { result } = renderHook(() => useLiveTranscription(true, false, 'on_device_wasm'));

    expect(result.current.engineMode).toBe('on_device_wasm');

    act(() => {
      result.current.startTranscription();
    });

    // Local WASM runner does not invoke Google webkitSpeechRecognition
    expect(mockRecognitionConstructor).not.toHaveBeenCalled();
    expect(result.current.isListening).toBe(true);

    act(() => {
      result.current.addManualUtterance('Patient reports stable mood on device.', 'patient');
    });

    expect(result.current.transcriptHistory.length).toBe(1);
    expect(result.current.transcriptHistory[0].text).toContain('Patient reports stable mood on device.');
  });
});
