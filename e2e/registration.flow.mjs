/**
 * End-to-end check of the public registration flow in a real browser.
 *
 *   bun run dev            # in another terminal
 *   node e2e/registration.flow.mjs [baseUrl]
 *
 * Fills every step (with Expo + accommodation), checks client-side validation,
 * submits, and verifies the confirmation screen. Uses a unique college name so
 * it can be run repeatedly against a local database.
 */
import { createRequire } from 'node:module';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Resolves a project or globally installed Playwright (npm i -D playwright).
const { chromium } = createRequire(import.meta.url)('playwright');

const base = process.argv[2] || 'http://localhost:3000';
const width = Number(process.env.WIDTH || 390);
const run = Date.now().toString(36);
const dir = mkdtempSync(join(tmpdir(), 'nexus-e2e-'));
const pdf = join(dir, 'abstract.pdf');
writeFileSync(pdf, '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const step = async (label) => {
  await page.getByRole('button', { name: new RegExp(`^Continue to ${label}`) }).click();
};
const ok = (cond, msg) => {
  if (!cond) throw new Error(`FAILED: ${msg}`);
  console.log(`✓ ${msg}`);
};

await page.goto(`${base}/register`, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

// Validation blocks an empty step.
await step('Faculty');
ok(await page.getByText('Enter your college name.').isVisible(), 'empty college step shows inline errors');

await page.getByLabel('College name').fill(`E2E Institute ${run}`);
await page.getByLabel('CSI student chapter name').fill('CSI E2E Chapter');
await page.getByLabel('City').fill('Mangaluru');
await step('Faculty');

await page.getByLabel('Faculty coordinator’s name').fill('Dr. Test Coordinator');
await page.getByLabel('Email ID').fill(`coordinator+${run}@example.edu`);
await page.getByLabel('Contact number').fill('+91 98765 43210');
await page.getByRole('radio', { name: /^Yes/ }).check();
await step('Delegation');

// Faculty accompanying + 4 representatives = 3 students.
await page.getByRole('radio', { name: /^4/ }).check();
const students = [
  ['Asha Rao', 'Computer Science', '3', '9876500001'],
  ['Bharath K', 'Electronics', '2', '9876500002'],
  ['Chitra S', 'Mechanical', '4', '9876500003'],
];
for (const [i, [name, dept, year, phone]] of students.entries()) {
  await page.locator(`#s${i}-fullName`).fill(name);
  await page.locator(`#s${i}-department`).fill(dept);
  await page.locator(`#s${i}-year`).selectOption(year);
  await page.locator(`#s${i}-contactNumber`).fill(phone);
  await page.locator(`#s${i}-email`).fill(`s${i}+${run}@example.edu`);
}
ok((await page.locator('.student-card').count()) === 3, 'faculty accompanying leaves 3 student slots for 4 representatives');
await step('Showcase');

await page.getByRole('radio', { name: /Asha Rao/ }).check();
await step('Expo');

await page.getByRole('radio', { name: /^Yes/ }).check();
await page.getByLabel('Project / product title').fill('Smart Water Grid');
await page.getByLabel('Project category').selectOption('Energy & Resource Management');
await page.getByLabel('Brief project description').fill('IoT sensors that detect leaks in campus water lines.');
await page.locator('#abstract').setInputFiles(pdf);
await page.getByRole('checkbox', { name: /Asha Rao/ }).check();
await step('Stay');
ok(
  await page
    .getByText(/Select 2–4 team members/)
    .first()
    .isVisible(),
  'one-member Expo team is rejected',
);
await page.getByRole('checkbox', { name: /Bharath K/ }).check();
await step('Stay');

await page.getByRole('radio', { name: /^Yes/ }).check();
await page.getByRole('radio', { name: /previous night/ }).check();
await page.getByRole('checkbox', { name: /Asha Rao/ }).check();
await page.getByRole('checkbox', { name: /Dr. Test Coordinator/ }).check();
await page.locator('#femaleAccommodationCount').fill('1');
await step('Submit');
ok(await page.getByText(/must equal the 2 people selected/).isVisible(), 'accommodation counts must match selected people');
await page.locator('#maleAccommodationCount').fill('1');
await step('Submit');

ok(await page.getByText('Smart Water Grid · Energy & Resource Management').isVisible(), 'review step summarises the Expo entry');
await page.getByRole('button', { name: /Submit registration/ }).click();
ok(await page.getByText('Please confirm the declaration to submit.').isVisible(), 'declaration is required');
await page.getByRole('checkbox', { name: /Declaration/ }).check();
await page.getByRole('button', { name: /Submit registration/ }).click();

await page.getByText('Your registration ID', { exact: true }).waitFor({ timeout: 15000 });
const code = (await page.locator('.code-block strong').textContent())?.trim();
ok(/^NEXUS26-\d{4}$/.test(code ?? ''), `confirmation shows registration ID ${code}`);
ok(await page.getByText(/Accommodation is subject to availability/).isVisible(), 'confirmation does not guarantee accommodation');
ok(await page.getByText(/not jury approval/).isVisible(), 'confirmation does not imply Expo jury approval');
ok((await page.evaluate(() => localStorage.getItem('nexus26-registration-draft-v1'))) === null, 'draft is cleared after submitting');
if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT, fullPage: true });
ok(errors.length === 0, `no page errors${errors.length ? `: ${errors.join('; ')}` : ''}`);

await browser.close();
console.log(`\nRegistration flow passed (${code}).`);
