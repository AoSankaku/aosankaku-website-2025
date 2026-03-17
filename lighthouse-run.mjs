import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { createServer } from 'net';

const CHROME_PATH = '/home/abcde/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';

// Find a free port
const getFreePort = () => new Promise((resolve, reject) => {
  const srv = createServer();
  srv.listen(0, '127.0.0.1', () => {
    const { port } = srv.address();
    srv.close(() => resolve(port));
  });
  srv.on('error', reject);
});

const port = await getFreePort();

const chrome = spawn(CHROME_PATH, [
  `--remote-debugging-port=${port}`,
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
], { stdio: 'ignore' });

// Give Chrome a moment to start
await new Promise(r => setTimeout(r, 2000));

const { default: lighthouse } = await import('lighthouse');

const url = process.argv[2] || 'http://localhost:14321/';

try {
  console.log(`Running Lighthouse on ${url} via port ${port}...`);
  const result = await lighthouse(url, {
    port,
    onlyCategories: ['performance', 'best-practices'],
    throttlingMethod: 'simulate',
    throttling: {
      cpuSlowdownMultiplier: 20,
      rttMs: 40,
      throughputKbps: 10240,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    output: 'html',
    logLevel: 'warn',
  });

  writeFileSync('lighthouse-report.html', result.report);
  console.log('\nReport saved to lighthouse-report.html');
  console.log('Performance score  :', Math.round(result.lhr.categories.performance.score * 100));
  console.log('Best Practices score:', Math.round(result.lhr.categories['best-practices'].score * 100));

  const m = result.lhr.audits;
  console.log('\n--- Key Metrics ---');
  console.log('FCP         :', m['first-contentful-paint'].displayValue);
  console.log('LCP         :', m['largest-contentful-paint'].displayValue);
  console.log('TBT         :', m['total-blocking-time'].displayValue);
  console.log('CLS         :', m['cumulative-layout-shift'].displayValue);
  console.log('Speed Index :', m['speed-index'].displayValue);
  console.log('TTI         :', m['interactive'].displayValue);

  const opps = Object.values(m)
    .filter(a => a.details?.type === 'opportunity' && (a.details.overallSavingsMs ?? 0) > 100)
    .sort((a, b) => b.details.overallSavingsMs - a.details.overallSavingsMs);

  if (opps.length) {
    console.log('\n--- Opportunities (savings > 100ms) ---');
    opps.forEach(a => console.log(`  ${a.title}: ~${Math.round(a.details.overallSavingsMs)}ms`));
  }

  // Main thread tasks breakdown
  const mainThreadWork = m['mainthread-work-breakdown'];
  if (mainThreadWork?.details?.items) {
    console.log('\n--- Main Thread Work Breakdown ---');
    mainThreadWork.details.items
      .sort((a, b) => b.duration - a.duration)
      .forEach(item => console.log(`  ${item.groupLabel}: ${Math.round(item.duration)}ms`));
  }

  // Diagnostics with numeric value
  const diags = Object.values(m)
    .filter(a => a.score !== null && a.score < 1 && a.details?.type === 'table' && a.details.items?.length > 0);
  if (diags.length) {
    console.log('\n--- Failed Diagnostics ---');
    diags.forEach(a => console.log(`  [${a.score?.toFixed(2) ?? '?'}] ${a.title}`));
  }

  // Render blocking detail
  const rb = m['render-blocking-resources'];
  if (rb?.details?.items?.length) {
    console.log('\n--- Render Blocking Resources ---');
    rb.details.items.forEach(item => console.log(`  ${item.url} — ${Math.round(item.totalBytes/1024)}KB, ~${Math.round(item.wastedMs)}ms`));
  }

  // Long tasks
  const lt = m['long-tasks'];
  if (lt?.details?.items?.length) {
    console.log('\n--- Long Tasks ---');
    lt.details.items.slice(0, 10).forEach(item => console.log(`  ${Math.round(item.duration)}ms at ${Math.round(item.startTime)}ms — ${item.url ?? ''}`));
  }

  // Script evaluation detail
  const se = m['bootup-time'];
  if (se?.details?.items?.length) {
    console.log('\n--- Script Evaluation Time ---');
    se.details.items.slice(0, 10).forEach(item => console.log(`  ${item.url?.split('/').slice(-1)[0]}: eval=${Math.round(item.scripting)}ms, parse=${Math.round(item.scriptParseCompile)}ms`));
  }

  // Best practices details
  const bp = result.lhr.categories['best-practices'];
  const bpFails = bp.auditRefs
    .map(ref => m[ref.id])
    .filter(a => a && a.score !== null && a.score < 1);
  if (bpFails.length) {
    console.log('\n--- Best Practices Failures ---');
    bpFails.forEach(a => {
      console.log(`  [${a.score?.toFixed(2) ?? '?'}] ${a.title}`);
      if (a.details?.items?.length) {
        a.details.items.slice(0, 5).forEach(item => {
          const desc = item.description || item.source?.url || item.url || JSON.stringify(item).slice(0, 120);
          console.log(`      • ${desc}`);
        });
      }
    });
  }
} finally {
  chrome.kill();
}
