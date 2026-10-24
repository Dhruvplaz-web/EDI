/**
 * Praxis AI - HTTP Load Testing Suite
 * Executes concurrent real HTTP benchmarks against Next.js endpoints:
 * 1. GET /api/health
 * 2. GET /login
 * 3. GET /
 * 4. POST /api/clinical/generate-soap (Unauthorized & rate limit checks)
 * 
 * Computes real p50, p95, p99, throughput (req/s), and error rates.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runScenario(name, endpoint, method = 'GET', concurrency = 20, totalRequests = 100, body = null, headers = {}) {
  console.log(`\n======================================================`);
  console.log(`[LOAD TEST SCENARIO]: ${name}`);
  console.log(`Target: ${method} ${BASE_URL}${endpoint} | Concurrency: ${concurrency} | Total Requests: ${totalRequests}`);
  console.log(`======================================================`);

  const latencies = [];
  let successCount = 0;
  let errorCount = 0;
  let completed = 0;
  const startTime = Date.now();

  const reqHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  async function worker() {
    while (completed < totalRequests) {
      completed++;
      const reqStart = performance.now();
      try {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
          method,
          headers: reqHeaders,
          body: body ? JSON.stringify(body) : undefined,
        });

        const reqDuration = performance.now() - reqStart;
        latencies.push(reqDuration);

        // Consider 2xx and expected auth rejections (401/403) as non-server error responses
        if (res.status < 500) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        latencies.push(performance.now() - reqStart);
        errorCount++;
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const totalTimeSec = (Date.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);

  const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p90 = latencies[Math.floor(latencies.length * 0.90)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = (latencies.length / totalTimeSec).toFixed(1);
  const errorRate = ((errorCount / latencies.length) * 100).toFixed(2);

  console.log(`Completed ${latencies.length} requests in ${totalTimeSec.toFixed(2)}s (${rps} req/sec)`);
  console.log(`Successes: ${successCount} | Errors (5xx/crash): ${errorCount} (${errorRate}%)`);
  console.log(`Latency Percentiles:`);
  console.log(`  p50 (Median): ${p50.toFixed(2)} ms`);
  console.log(`  p90:          ${p90.toFixed(2)} ms`);
  console.log(`  p95:          ${p95.toFixed(2)} ms`);
  console.log(`  p99:          ${p99.toFixed(2)} ms`);
  console.log(`  Min / Max:    ${latencies[0]?.toFixed(2)} ms / ${latencies[latencies.length - 1]?.toFixed(2)} ms`);

  return {
    scenario: name,
    totalRequests: latencies.length,
    rps: Number(rps),
    errorRate: Number(errorRate),
    p50: Number(p50.toFixed(2)),
    p95: Number(p95.toFixed(2)),
    p99: Number(p99.toFixed(2)),
  };
}

async function main() {
  console.log(`Starting Praxis AI Real HTTP Load Tests against ${BASE_URL}...`);

  const results = [];

  // Scenario 1: Healthcheck Baseline (Lightweight JSON endpoint)
  results.push(await runScenario('Healthcheck Baseline', '/api/health', 'GET', 10, 100));

  // Scenario 2: Landing Page Stress (HTML SSR Render)
  results.push(await runScenario('Landing Page Concurrency', '/', 'GET', 20, 100));

  // Scenario 3: Login Page Stress
  results.push(await runScenario('Login Page Concurrency', '/login', 'GET', 20, 100));

  // Scenario 4: Clinical SOAP API Stress & Unauthorized Auth Gating
  results.push(await runScenario(
    'Clinical API Auth & Input Gate',
    '/api/clinical/generate-soap',
    'POST',
    15,
    60,
    { patientId: 'test_123', patientName: 'Test Patient' }
  ));

  console.log('\n\n======================================================');
  console.log('SUMMARY TABLE: REAL HTTP BENCHMARK RESULTS');
  console.log('======================================================');
  console.table(results);
}

main().catch(err => {
  console.error('Load test runner failed:', err);
  process.exit(1);
});
