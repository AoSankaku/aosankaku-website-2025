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

try {
  console.log(`Running Lighthouse on port ${port}...`);
  const result = await lighthouse('http://localhost:14321/', {
    port,
    onlyCategories: ['performance'],
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
  console.log('Performance score:', Math.round(result.lhr.categories.performance.score * 100));

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
} finally {
  chrome.kill();
}
