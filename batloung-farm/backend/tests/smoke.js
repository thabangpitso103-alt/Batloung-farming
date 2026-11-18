// End-to-end check of the API.  Usage: start the server, then  npm run test:api
// Requires: database set up with "npm run db:setup" (fresh sample data)
const BASE = process.env.API_URL || 'http://localhost:3100/api';
let passed = 0, failed = 0;

async function call(method, url, body) {
  const res = await fetch(BASE + url, {
    method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}
function check(name, cond, extra = '') {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name} ${extra}`); }
}
const stockOf = async (fruitId, size) =>
  (await call('GET', `/stock/fruit/${fruitId}`)).body.data.find((r) => r.packaging_size === size).available_quantity;

(async () => {
  console.log('\n== Health & suppliers ==');
  check('health 200', (await call('GET', '/health')).status === 200);
  let r = await call('POST', '/suppliers', { business_name: 'North West Farms', contact_person: 'Test User', phone: '+27180009999', province: 'North West', address: '1 Test Road, Mahikeng' });
  check('create supplier -> 201', r.status === 201);
  const supId = r.body.data?.supplier_id;
  check('duplicate supplier -> 409', (await call('POST', '/suppliers', { business_name: 'North West Farms', contact_person: 'X', phone: '+27180001234', province: 'Gauteng', address: 'x' })).status === 409);
  check('invalid province -> 400', (await call('POST', '/suppliers', { business_name: 'Bad', contact_person: 'X', phone: '+27180001235', province: 'Narnia', address: 'x' })).status === 400);
  check('get supplier -> 200', (await call('GET', `/suppliers/${supId}`)).status === 200);
  check('get missing supplier -> 404', (await call('GET', '/suppliers/9999')).status === 404);
  check('update supplier -> 200', (await call('PUT', `/suppliers/${supId}`, { contact_person: 'New Contact' })).body.data?.contact_person === 'New Contact');
  check('delete supplier w/o purchases -> 200', (await call('DELETE', `/suppliers/${supId}`)).status === 200);
  check('delete supplier WITH purchases -> 409', (await call('DELETE', '/suppliers/2')).status === 409);

  console.log('\n== Fruits, vendors ==');
  r = await call('POST', '/fruits', { fruit_name: 'Pears', description: 'Packham pears', prices: { small: 90, medium: 130, large: 180 } });
  check('create fruit -> 201 (with 3 stock rows)', r.status === 201);
  const pearId = r.body.data?.fruit_id;
  check('new fruit has stock rows for 3 sizes', (await call('GET', `/stock/fruit/${pearId}`)).body.count === 3);
  check('update fruit -> 200', (await call('PUT', `/fruits/${pearId}`, { description: 'Updated' })).status === 200);
  check('low stock list works', (await call('GET', '/stock/low?threshold=10')).body.count > 0);
  r = await call('POST', '/vendors', { vendor_name: 'Test Vendor', phone_number: '+26658009999', location: 'Maseru West' });
  check('create vendor -> 201', r.status === 201);
  const vId = r.body.data?.vendor_id;
  check('search vendor by name', (await call('GET', '/vendors/search?q=Test Vend')).body.count === 1);
  check('search vendor by phone', (await call('GET', '/vendors/search?q=58009999')).body.count === 1);
  check('update vendor -> 200', (await call('PUT', `/vendors/${vId}`, { location: 'Maseru East' })).status === 200);

  console.log('\n== Purchase (multi-item, auto total, stock up) ==');
  const before = await stockOf(1, 'LARGE');
  r = await call('POST', '/purchases', { supplier_id: 2, items: [
    { fruit_id: 1, packaging_size: 'LARGE', quantity: 4, unit_cost: 150 },
    { fruit_id: 1, packaging_size: 'SMALL', quantity: 2, unit_cost: 80.5 }] });
  check('purchase -> 201', r.status === 201);
  check('total auto-calculated (4*150 + 2*80.5 = 761)', r.body.data?.total_amount === 761, JSON.stringify(r.body.data?.total_amount));
  check('stock increased by 4 (large apples)', (await stockOf(1, 'LARGE')) === before + 4);
  const preFail = await stockOf(1, 'LARGE');
  r = await call('POST', '/purchases', { supplier_id: 2, items: [
    { fruit_id: 1, packaging_size: 'LARGE', quantity: 5, unit_cost: 150 },
    { fruit_id: 999, packaging_size: 'LARGE', quantity: 1, unit_cost: 10 }] });
  check('purchase with unknown fruit -> 404 and ROLLBACK', r.status === 404 && (await stockOf(1, 'LARGE')) === preFail);
  check('purchase negative cost -> 400', (await call('POST', '/purchases', { supplier_id: 2, items: [{ fruit_id: 1, packaging_size: 'LARGE', quantity: 1, unit_cost: -5 }] })).status === 400);

  console.log('\n== Sales: the "10 large boxes but only 6 available" rule ==');
  // make sure large apples are exactly 6 for the demo
  const have = await stockOf(1, 'LARGE');
  if (have > 6) await call('POST', '/sales', { vendor_id: vId, payment_method: 'CASH', items: [{ fruit_id: 1, packaging_size: 'LARGE', quantity: have - 6 }] });
  check('large apples now = 6', (await stockOf(1, 'LARGE')) === 6);
  const mediumBefore = await stockOf(1, 'MEDIUM');
  const salesBefore = (await call('GET', '/sales')).body.count;
  r = await call('POST', '/sales', { vendor_id: vId, items: [
    { fruit_id: 1, packaging_size: 'MEDIUM', quantity: 2 },     // fine on its own...
    { fruit_id: 1, packaging_size: 'LARGE', quantity: 10 }] }); // ...but this one fails
  check('10 large requested, 6 available -> 400', r.status === 400, r.body.error);
  console.log('        message:', r.body.error);
  check('large stock unchanged (6)', (await stockOf(1, 'LARGE')) === 6);
  check('medium stock rolled back too', (await stockOf(1, 'MEDIUM')) === mediumBefore);
  check('no incomplete sale created', (await call('GET', '/sales')).body.count === salesBefore);

  console.log('\n== Successful multi-item sale, payments ==');
  // apples: S110 M155 L205 ; mangoes M190
  r = await call('POST', '/sales', { vendor_id: vId, payment_method: 'MOBILE_MONEY', amount_paid: 300, reference: 'MPESA-123', items: [
    { fruit_id: 1, packaging_size: 'LARGE', quantity: 2 },
    { fruit_id: 1, packaging_size: 'MEDIUM', quantity: 3 },
    { fruit_id: 4, packaging_size: 'MEDIUM', quantity: 1 }] });
  check('sale -> 201', r.status === 201);
  const expected = 2 * 205 + 3 * 155 + 190; // 1065
  check(`total = ${expected}`, r.body.data?.total_amount === expected, String(r.body.data?.total_amount));
  check('status PARTIALLY_PAID', r.body.data?.payment_status === 'PARTIALLY_PAID');
  check(`outstanding = ${expected - 300}`, r.body.data?.outstanding_balance === expected - 300);
  check('large stock reduced to 4', (await stockOf(1, 'LARGE')) === 4);
  const saleId = r.body.data?.sale_id;
  check('overpayment -> 400', (await call('POST', `/sales/${saleId}/payments`, { amount: 99999, payment_method: 'CASH' })).status === 400);
  r = await call('POST', `/sales/${saleId}/payments`, { amount: expected - 300, payment_method: 'CASH' });
  check('final payment -> PAID', r.status === 201 && r.body.data.payment_status === 'PAID' && r.body.data.outstanding_balance === 0);
  r = await call('POST', '/sales', { vendor_id: vId, payment_method: 'CREDIT', items: [{ fruit_id: 2, packaging_size: 'SMALL', quantity: 1 }] });
  check('credit sale -> UNPAID', r.body.data?.payment_status === 'UNPAID' && r.body.data?.amount_paid === 0);
  r = await call('GET', `/vendors/${vId}/balance`);
  check('vendor balance = 80', r.body.data?.outstanding_balance === 80, JSON.stringify(r.body.data?.outstanding_balance));
  check('unknown vendor -> 404', (await call('POST', '/sales', { vendor_id: 9999, items: [{ fruit_id: 1, packaging_size: 'SMALL', quantity: 1 }] })).status === 404);
  check('empty items -> 400', (await call('POST', '/sales', { vendor_id: vId, items: [] })).status === 400);
  check('bad packaging size -> 400', (await call('POST', '/sales', { vendor_id: vId, items: [{ fruit_id: 1, packaging_size: 'HUGE', quantity: 1 }] })).status === 400);
  check('outstanding vendors list', (await call('GET', '/vendors/outstanding')).body.count >= 3);

  console.log('\n== Reports ==');
  r = await call('GET', '/reports/top-fruits'); check('top 5 fruits', r.status === 200 && r.body.count === 5);
  r = await call('GET', '/reports/revenue?from=2026-10-01&to=2026-10-31'); check('revenue in range', r.status === 200 && r.body.data.total_revenue > 0);
  check('revenue bad dates -> 400', (await call('GET', '/reports/revenue?from=abc&to=2026-10-31')).status === 400);
  r = await call('GET', '/reports/top-vendor'); check('top vendor', r.status === 200 && !!r.body.data.vendor_name);
  r = await call('GET', '/reports/stock-levels'); check('stock levels (fruit x size)', r.status === 200 && r.body.count >= 15);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('Test crashed:', e.message); process.exit(1); });
