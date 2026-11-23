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

await page.getByLabel('College name').fill('NMAM Institute of Technology, Nitte');
await page.getByLabel('College name').press('Tab');
const hostDialog = page.getByRole('dialog', { name: 'Are you from NMAMIT, Nitte?' });
ok(!(await hostDialog.getByText(/is hosting NEXUS/).isVisible()), 'host instructions wait for confirmation');
await hostDialog.getByRole('button', { name: 'Yes, I’m from NMAMIT' }).click();
ok(await hostDialog.getByText(/is hosting NEXUS/).isVisible(), 'the popup explains the host category');
await hostDialog.getByRole('button', { name: 'Use No Active CSI Branch' }).click();
ok((await page.getByLabel('College category').inputValue()) === 'no_active_csi', 'NMAMIT notice selects the correct category');

await page.getByLabel('College name').fill(`E2E Institute ${run}`);
await page.getByLabel('College category').selectOption('active_csi');
await page.getByLabel('CSI student branch name').fill('CSI E2E Chapter');
await page.getByLabel('City').fill('Mangaluru');
await step('Faculty');

await page.getByLabel('Faculty coordinator’s name').fill('Dr. Test Coordinator');
await page.getByLabel('Email ID').fill(`coordinator+${run}@example.edu`);
await page.getByLabel('Contact number').fill('+91 98765 43210');
await page.getByRole('radio', { name: /^Yes/ }).check();
await step('Delegation');

// The accompanying coordinator is not counted as a student.
for (let i = 0; i < 3; i++) await page.getByRole('button', { name: /Add a student/ }).click();
const students = [
  ['Asha Rao', 'Computer Science', '3', '9876500001'],
  ['Bharath K', 'Electronics', '2', '9876500002'],
  ['Chitra S', 'Mechanical', '4', '9876500003'],
  ['Dev N', 'Information Science', '2', '9876500004'],
  ['Esha P', 'Electrical', '3', '9876500005'],
];
for (const [i, [name, dept, year, phone]] of students.entries()) {
  await page.locator(`#s${i}-fullName`).fill(name);
  await page.locator(`#s${i}-department`).fill(dept);
  await page.locator(`#s${i}-year`).selectOption(year);
  await page.locator(`#s${i}-contactNumber`).fill(phone);
  await page.locator(`#s${i}-email`).fill(`s${i}+${run}@example.edu`);
}
ok((await page.locator('.student-card').count()) === 5, 'five students are accepted with an accompanying coordinator');
ok(await page.getByRole('button', { name: /Add a student/ }).isDisabled(), 'the form caps delegations at five students');
await step('Showcase');

await page.getByRole('radio', { name: /Asha Rao/ }).check();
await step('Expo');

await page.getByRole('radio', { name: /^Yes/ }).check();
await page.getByLabel('Team name').fill('Water Innovators');
await page.getByLabel('Project / product title').fill('Smart Water Grid');
await page.getByLabel('Project category').selectOption('Energy & Resource Management');
await page.getByLabel('Brief project description').fill('IoT sensors that detect leaks in campus water lines.');
await page.locator('#abstract').setInputFiles(pdf);
await page.getByRole('radio', { name: /^5/ }).check();
for (const name of ['Asha Rao', 'Bharath K', 'Chitra S', 'Dev N', 'Esha P']) {
  await page.getByRole('checkbox', { name: new RegExp(name) }).check();
}
ok((await page.getByRole('radio', { name: /^1 student/ }).count()) === 0, 'Expo does not offer solo teams');
await step('Stay');
await page.getByText('Accommodation requests are closed.', { exact: true }).waitFor();
ok((await page.getByRole('radio', { name: /^Yes/ }).count()) === 0, 'the stay step accepts no new requests');
await step('Payment');

await page.getByLabel(/UTR Number/).fill(String(Date.now()).slice(-12));
await step('Submit');
ok(await page.getByText('Upload the payment proof screenshot.').isVisible(), 'payment requires a screenshot');

const image = await page.evaluate(() => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 800;
  const ctx = canvas.getContext('2d');
  const pixels = ctx.createImageData(800, 800);
  for (let i = 0; i < pixels.data.length; i += 4) {
    pixels.data[i] = Math.random() * 255;
    pixels.data[i + 1] = Math.random() * 255;
    pixels.data[i + 2] = Math.random() * 255;
    pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas.toDataURL('image/png').split(',')[1];
});
const largePng = Buffer.from(image, 'base64');
ok(largePng.length > 1024 * 1024, 'test screenshot is larger than the upload limit');
await page.locator('#paymentScreenshot').setInputFiles({ name: 'payment.png', mimeType: 'image/png', buffer: largePng });
await page.getByText('payment.jpg', { exact: true }).waitFor();
await step('Submit');
ok(await page.getByText('payment.jpg', { exact: true }).isVisible(), 'compressed proof survives the payment step');

ok(await page.getByText('Smart Water Grid · Energy & Resource Management').isVisible(), 'review step summarises the Expo entry');
await page.getByRole('button', { name: /Submit registration/ }).click();
ok(await page.getByText('Please confirm the declaration to submit.').isVisible(), 'declaration is required');
await page.getByRole('checkbox', { name: /Declaration/ }).check();
await page.getByRole('button', { name: /Submit registration/ }).click();

await page.getByText('Your registration ID', { exact: true }).waitFor({ timeout: 15000 });
const code = (await page.locator('.code-block strong').textContent())?.trim();
ok(/^NEXUS26-\d{4}$/.test(code ?? ''), `confirmation shows registration ID ${code}`);
ok(await page.getByText(/not jury approval/).isVisible(), 'confirmation does not imply Expo jury approval');
ok((await page.evaluate(() => localStorage.getItem('nexus26-registration-draft-v1'))) === null, 'draft is cleared after submitting');
if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT, fullPage: true });
const summaryLink = await page.getByRole('link', { name: 'Open summary link' }).getAttribute('href');
await page.goto(`${base}/?intro=0`);
const headerLink = page.getByRole('banner').getByRole('link', { name: 'View registration' });
await headerLink.click();
await page.getByText(code, { exact: true }).waitFor();
await page.reload();
await page.getByText(code, { exact: true }).waitFor();
ok(await page.getByRole('link', { name: 'Register another team' }).isVisible(), 'saved receipt survives reload and allows another team');

const returning = await browser.newPage({ viewport: { width, height: 900 } });
await returning.goto(`${base}/register`);
await returning.getByRole('link', { name: /Already registered/ }).click();
await returning.getByText(/open the secure link in your confirmation email/i).waitFor();
console.log('✓ returning users on a fresh browser can find recovery guidance');
await returning.goto(`${base}${summaryLink}`);
await returning.getByText(code, { exact: true }).waitFor();
ok(await returning.getByText('Submitted for Verification', { exact: true }).isVisible(), 'secure summary shows payment status');
await returning.goto(`${base}/?intro=0`);
await returning.getByRole('banner').getByRole('link', { name: 'View registration' }).waitFor();
console.log('✓ opening a valid older summary enables the returning CTA');
await returning.close();
ok(errors.length === 0, `no page errors${errors.length ? `: ${errors.join('; ')}` : ''}`);

await browser.close();
console.log(`\nRegistration flow passed (${code}).`);
