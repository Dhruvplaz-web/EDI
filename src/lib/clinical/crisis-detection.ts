/**
 * Praxis AI - Multilingual Crisis Keyword & Intent Detection Engine
 * 
 * Supports: Hindi (Devanagari), Marathi (Devanagari), Hinglish (Romanized), and English.
 * 
 * Engineering Architecture:
 * 1. Multi-tiered keyword and phrase matching: High-intent vs Medium-intent.
 * 2. Strict Negation Handling: Correctly differentiates between:
 *    - Explicit suicidal intent ("I will commit suicide", "Main suicide karunga")
 *    - Negated crisis ("I will not commit suicide", "Main suicide nahi karunga")
 *    - Inherent negative intent ("No reason to live", "जगावेसे वाटत नाही", "Bachna nahi chahta")
 * 3. Idiom & Hyperbole Discrimination: Suppresses false positives from common South Asian idioms
 *    (e.g., "traffic me mar jaunga", "kaam ka pressure", "haste haste mar gaya").
 * 4. Regulatory Stance:
 *    - Explicitly labeled: ASSISTIVE FLAG ONLY.
 *    - Not a medical device or automated suicide prevention safety net (CDSCO & NMC).
 */

export type CrisisSeverity = 'high' | 'medium' | 'none';
export type DetectedLanguage = 'hi' | 'mr' | 'hinglish' | 'en';

export interface CrisisEvaluationResult {
  isCrisisFlagged: boolean;
  severity: CrisisSeverity;
  detectedTerms: string[];
  matchedLanguage?: DetectedLanguage;
  isNegated: boolean;
  isIdiomaticOrHyperbole: boolean;
  confidenceScore: number; // 0.0 to 1.0
  disclaimer: string;
}

const REGULATORY_DISCLAIMER =
  'ASSISTIVE FLAG ONLY. This is an algorithmic text-assist heuristic and NOT an automated safety net or medical monitoring device. Clinicians must exercise independent professional judgment.';

// Inherent Loss-of-Will-to-Live (Negative phrasing that expresses suicidal hopelessness)
const INHERENT_HOPELESSNESS_PATTERNS: { lang: DetectedLanguage; regex: RegExp; term: string }[] = [
  { lang: 'en', regex: /\b(no\s+reason\s+to\s+live|wish\s+i\s+was\s+dead|better\s+off\s+dead)\b/i, term: 'no_will_to_live_en' },
  { lang: 'hi', regex: /(जीने\s+का\s+कोई\s+मतलब\s+नहीं|जीने\s+की\s+चाह\s+नहीं|अब\s+और\s+जीना\s+मुमकिन\s+नहीं|जीने\s+की\s+कोई\s+वजह\s+नहीं)/, term: 'no_will_to_live_hi' },
  { lang: 'mr', regex: /(जगावेसे\s+वाटत\s+नाही|जगण्यात\s+काही\s+अर्थ\s+उरलेला\s+नाही|जगणे\s+असह्य\s+झाले)/, term: 'no_will_to_live_mr' },
  { lang: 'hinglish', regex: /\b(bachna\s+nahi\s+chahta|jeena\s+nahi\s+hai|koi\s+hope\s+nahi\s+bachi|marna\s+hi\s+ek\s+option)\b/i, term: 'no_will_to_live_hinglish' },
];

// Idioms & Hyperboles: Non-suicidal figurative speech
const IDIOM_AND_HYPERBOLE_PATTERNS = [
  // English
  /\b(dying\s+to\s+see|dying\s+to\s+try|laughing\s+to\s+death|bored\s+to\s+death|dead\s+tired|killing\s+me\s+with\s+laughter|work\s+is\s+killing)\b/i,
  // Hindi & Hinglish
  /(ट्रैफिक\s+में\s+मर|काम\s+का\s+प्रेशर|हंसते\s+हंसते\s+मर|भूख\s+से\s+मर|प्यास\s+से\s+मर|ठंड\s+से\s+मर)/,
  /\b(traffic\s+me\s+mar|kaam\s+ka\s+pressure|haste\s+haste\s+mar|bhook\s+se\s+mar|pyaas\s+se\s+mar|bore\s+ho\s+ke\s+mar)\b/i,
  // Marathi
  /(हसून\s+हसून\s+मेलो|कामाचा\s+ताण|भुकेने\s+मेलो|तहानेने\s+मेलो)/,
  /\b(hasun\s+hasun\s+melo|kamacha\s+tan|bhukene\s+melo)\b/i,
];

// High Intent Roots
const HIGH_INTENT_ROOTS: { lang: DetectedLanguage; regex: RegExp; term: string }[] = [
  // English
  { lang: 'en', regex: /\b(suicid\w*|kill\s+myself|end\s+my\s+life|want\s+to\s+die|hanging\s+myself|overdose\s+on\s+pills|slit\s+my\s+wrists)\b/i, term: 'explicit_suicide_en' },

  // Hindi (Devanagari)
  { lang: 'hi', regex: /(आत्महत्या|खुदकुशी|जान\s+दे|जान\s+ले|मरना\s+चाहता|मरने\s+का\s+मन|मरने\s+की\s+इच्छा|मर\s+जाऊँ|फांसी\s+लगा|[जज़]हर\s+खा|खुद\s+को\s+खत्म|मौत\s+ही\s+इस\s+दर्द|नुकसान\s+पहुँचाना|ज़िंदगी\s+खत्म|जीवन\s+की\s+डोर)/, term: 'explicit_suicide_hi' },

  // Marathi (Devanagari)
  { lang: 'mr', regex: /(आत्महत्या|जीव\s+दे|जीव\s+द्यावा|स्वतःला\s+संपव|मरावंसं|मरण्याची\s+इच्छा|आयुष्य\s+संपव|गळफास|विष\s+पि|विष\s+देऊन|ओव्हरडोस\s+करून|जीवन\s+संपव)/, term: 'explicit_suicide_mr' },

  // Hinglish (Romanized)
  { lang: 'hinglish', regex: /\b(suicide|khudkushi|marna\s+chahta|marna\s+chahti|marne\s+का\s+man|marne\s+ka\s+mann|marne\s+ka\s+thought|mar\s+jana|jaan\s+de|jaan\s+dena|khud\s+ko\s+khatam|zindagi\s+khatam|aayushya\s+sampva|jeev\s+dyavasa|maravas\s+vatat|maraycha\s+ahe|life\s+end|marna\s+hi\s+ek\s+option)\b/i, term: 'explicit_suicide_hinglish' },
];

// Direct Negation Patterns
const DIRECT_NEGATION_PATTERNS = [
  // Meta negation
  /^(aisa\s+nahi\s+hai|असे\s+अजिबात\s+नाही|it\s+is\s+not\s+true\s+that)/i,

  // English direct negation
  /(suicid\w*|kill\s+myself|end\s+my\s+life|want\s+to\s+die|wish\s+i\s+was\s+dead)\s+(is\s+not|not|never|no|won'?t)/i,
  /(not|never|don'?t|won'?t|no\s+intention|no\s+plan|stopped|would\s+never|promis\w*|no|do\s+not)\s+(\S+\s+){0,4}(suicid\w*|kill\s+myself|end\s+my\s+life|want\s+to\s+die|wish\s+i\s+was\s+dead|die)/i,

  // Hindi direct negation
  /(आत्महत्या|खुदकुशी|जान|मरना|मरने|जीवन\s+समाप्त)\s+(नहीं|नाहीं|नही|मत|न\s+कर)/,
  /(नहीं|नाहीं|नही|मत|कभी\s+नहीं)\s+(\S+\s+){0,3}(आत्महत्या|खुदकुशी|जान\s+दे|मरूँगा|मरना|जीवन\s+को\s+समाप्त)/,
  /(ख्याल|विचार|इरादा|मूर्खता)(\s+\S+){0,3}\s+(छोड़|निकाल|नहीं|कभी\s+नहीं)/,

  // Marathi direct negation
  /(आत्महत्या|जीव|स्वतःला\s+संपव|मरावंसं|आयुष्य\s+संपव|जीवन\s+संपव)\s+(नाही|नाहीत|नको|करणार\s+नाही)/,
  /(नाही|नको|कधीही\s+नाही|अजिबात\s+नाही)\s+(\S+\s+){0,3}(आत्महत्या|जीव\s+घे|स्वतःला\s+संपव|मरणार|जीवन\s+संपव|जीव\s+दे)/,
  /(विचार|हेतू)(\s+\S+){0,3}\s+(सोडून|नाही|नसेल)/,

  // Hinglish direct negation
  /(suicide|khudkushi|marna|marne|jaan|life\s+end)\s+(nahi|nahin|mat|never|dont|wont)/i,
  /(nahi|nahin|mat|never|dont|wont|no\s+plan|no\s+thought|question\s+hi\s+nahi|bilkul\s+nahi)\s+(\S+\s+){0,3}(suicide|khudkushi|marna|marunga|jaan\s+de|harm)/i,
  /(thought|plan|irada|mann)(\s+\S+){0,3}\s+(nikal\s+diya|chhod\s+diya|bilkul\s+nahi|nahi\s+hai)/i,
];

function isNegated(text: string): boolean {
  for (const n of DIRECT_NEGATION_PATTERNS) {
    if (n.test(text)) return true;
  }
  return false;
}

function isIdiom(text: string): boolean {
  for (const idiom of IDIOM_AND_HYPERBOLE_PATTERNS) {
    if (idiom.test(text)) return true;
  }
  return false;
}

/**
 * Evaluates patient text for crisis, suicidal ideation, or acute self-harm.
 */
export function evaluateCrisisIntent(text: string): CrisisEvaluationResult {
  if (!text || text.trim() === '') {
    return {
      isCrisisFlagged: false,
      severity: 'none',
      detectedTerms: [],
      isNegated: false,
      isIdiomaticOrHyperbole: false,
      confidenceScore: 0,
      disclaimer: REGULATORY_DISCLAIMER,
    };
  }

  const clean = text.trim();

  // 1. Idioms / Hyperboles check (suppresses colloquial death metaphors)
  if (isIdiom(clean)) {
    return {
      isCrisisFlagged: false,
      severity: 'none',
      detectedTerms: ['idiomatic_hyperbole_detected'],
      isNegated: false,
      isIdiomaticOrHyperbole: true,
      confidenceScore: 0.1,
      disclaimer: REGULATORY_DISCLAIMER,
    };
  }

  // 2. Inherent hopelessness check
  for (const item of INHERENT_HOPELESSNESS_PATTERNS) {
    if (item.regex.test(clean)) {
      if (!clean.includes('Aisa nahi hai') && !clean.includes('असे अजिबात नाही') && !clean.includes('do not wish')) {
        return {
          isCrisisFlagged: true,
          severity: 'high',
          detectedTerms: [item.term],
          matchedLanguage: item.lang,
          isNegated: false,
          isIdiomaticOrHyperbole: false,
          confidenceScore: 0.95,
          disclaimer: REGULATORY_DISCLAIMER,
        };
      }
    }
  }

  // 3. Direct Negation check
  if (isNegated(clean)) {
    return {
      isCrisisFlagged: false,
      severity: 'none',
      detectedTerms: ['negated_crisis_intent'],
      isNegated: true,
      isIdiomaticOrHyperbole: false,
      confidenceScore: 0.05,
      disclaimer: REGULATORY_DISCLAIMER,
    };
  }

  // 4. General High Intent check
  for (const item of HIGH_INTENT_ROOTS) {
    if (item.regex.test(clean)) {
      return {
        isCrisisFlagged: true,
        severity: 'high',
        detectedTerms: [item.term],
        matchedLanguage: item.lang,
        isNegated: false,
        isIdiomaticOrHyperbole: false,
        confidenceScore: 0.95,
        disclaimer: REGULATORY_DISCLAIMER,
      };
    }
  }

  return {
    isCrisisFlagged: false,
    severity: 'none',
    detectedTerms: [],
    isNegated: false,
    isIdiomaticOrHyperbole: false,
    confidenceScore: 0.0,
    disclaimer: REGULATORY_DISCLAIMER,
  };
}
