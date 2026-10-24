/**
 * Praxis AI - Google Cloud Vertex AI Enterprise Authentication
 * 
 * Provides OAuth2 service-account Bearer tokens for Google Cloud Vertex AI REST endpoints.
 * Complies with DPDP Act 2023 Processor requirements under Google Cloud India DPA (service-account authentication only; no consumer API keys).
 */

import crypto from 'crypto';

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedAccessToken: CachedToken | null = null;

function base64UrlEncode(data: string | Buffer): string {
  const buf = typeof data === 'string' ? Buffer.from(data) : data;
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Mints a Google OAuth2 Bearer token from Service Account credentials.
 */
export async function getVertexAiAccessToken(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);

  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60) {
    return cachedAccessToken.token;
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    // If running in GCP environment with Metadata Server
    try {
      const metaRes = await fetch(
        'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
        {
          headers: { 'Metadata-Flavor': 'Google' },
          signal: AbortSignal.timeout(2000),
        }
      );
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        cachedAccessToken = {
          token: metaData.access_token,
          expiresAt: now + (metaData.expires_in || 3600),
        };
        return cachedAccessToken.token;
      }
    } catch {
      // Metadata server unavailable
    }
    return null;
  }

  try {
    privateKey = privateKey.replace(/\\n/g, '\n');

    // Create JWT Header and Claim
    const header = { alg: 'RS256', typ: 'JWT' };
    const claimSet = {
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const claimB64 = base64UrlEncode(JSON.stringify(claimSet));
    const unsignedJwt = `${headerB64}.${claimB64}`;

    // Sign with RSA-SHA256
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(unsignedJwt);
    const signature = signer.sign(privateKey);
    const signedJwt = `${unsignedJwt}.${base64UrlEncode(signature)}`;

    // Exchange JWT assertion for OAuth2 Access Token
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: signedJwt,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      cachedAccessToken = {
        token: data.access_token,
        expiresAt: now + (data.expires_in || 3600),
      };
      return cachedAccessToken.token;
    }
  } catch (err) {
    console.warn('[Vertex AI Auth] Access token minting error:', err);
  }

  return null;
}
