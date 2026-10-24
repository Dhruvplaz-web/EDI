import { describe, it, expect, beforeEach } from 'vitest';
import { LinguisticSentimentAnalyzer } from '@/lib/telemetry/linguistic-sentiment';

describe('LinguisticSentimentAnalyzer (Crisis Detection & Negation Parsing)', () => {
  let analyzer: LinguisticSentimentAnalyzer;

  beforeEach(() => {
    analyzer = new LinguisticSentimentAnalyzer();
  });

  it('triggers crisis alert on acute suicidal ideation phrases', () => {
    const result = analyzer.analyzeUtterance('I just want to end it all and kill myself', Date.now());

    expect(result.isCrisisAlert).toBe(true);
    expect(result.clinicalRiskScore).toBeGreaterThanOrEqual(9.0);
    expect(result.flaggedTokens.length).toBeGreaterThan(0);
    expect(result.flaggedTokens.some(t => t.category === 'suicide_risk')).toBe(true);
  });

  it('correctly suppresses crisis alert on multi-word negations ("not planning to kill myself")', () => {
    const result = analyzer.analyzeUtterance('I am definitely not planning to kill myself today', Date.now());

    // The negation "not" within the same clause must prevent crisis alert
    expect(result.isCrisisAlert).toBe(false);
    expect(result.flaggedTokens.length).toBe(0);
  });

  it('correctly suppresses crisis alert on "no thoughts of hurting myself"', () => {
    const result = analyzer.analyzeUtterance('Doctor, I have had no thoughts of hurting myself or anyone', Date.now());

    expect(result.isCrisisAlert).toBe(false);
  });

  it('respects sentence clause boundaries: "I said no. I want to die" MUST trigger alert', () => {
    const result = analyzer.analyzeUtterance('I said no. I want to die.', Date.now());

    // The "no" is in the prior sentence, so "want to die" is NOT negated!
    expect(result.isCrisisAlert).toBe(true);
    expect(result.flaggedTokens.some(t => t.phrase.includes('die'))).toBe(true);
  });

  it('calculates speech velocity (Words Per Minute) accurately over time windows', () => {
    const baseTime = 1700000000000;
    // 30 words in 10 seconds -> 180 WPM
    const words30 = 'The patient spoke thirty distinct words inside a short temporal speech window to accurately test the word cadence velocity calculation mechanism under standard clinical tele-mental health consultation conditions and audio transcription streams.';
    
    analyzer.analyzeUtterance(words30, baseTime);
    const result = analyzer.analyzeUtterance('Continuing the dialogue with further words.', baseTime + 10000);

    expect(result.speechVelocityWpm).toBeGreaterThan(60);
    expect(result.speechVelocityWpm).toBeLessThan(300);
  });
});
