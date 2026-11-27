/**
 * Revasser shop sheet: orders and products.
 *
 * Orders tab: the website writes each order here and emails you. Track Order on
 * the website reads the Status column, so change Status as the order moves.
 *
 * Products tab: the website reads prices, stock and visibility from here every
 * few minutes. New pieces added in Pages CMS appear here by themselves.
 * Cost Price, Profit Margin % and Notes are never sent to the website.
 *
 * Setup (once): Extensions → Apps Script, paste this file, run `setup`,
 * then Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * Requests without the secret are refused, so "Anyone" only means "anyone holding the secret".
 */

const TAB = 'Orders';
const STATUSES = ['New', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
const HEADERS = [
  'Order no', 'Date', 'Status', 'Name', 'Mobile', 'Email', 'District', 'Area / thana', 'Address',
  'Items', 'Subtotal', 'Delivery', 'Total', 'Payment', 'Customer note', 'Message for customer',
];

const PRODUCTS_TAB = 'Products';
const AVAILABILITY = ['In stock', 'Pre-order', 'Sold out', 'Confirm by phone'];
// The website reads only Product Id, Regular Price, Promo Price, In Stock, Availability and Show on website.
const PRODUCT_HEADERS = [
  'Product Id', 'Product Name', 'Category', 'Brand', 'Colour / Size', 'Regular Price', 'Promo Price',
  'In Stock', 'Availability', 'Show on website', 'Cost Price', 'Profit Margin %', 'Image', 'Notes',
];

/** Run once from the editor. It prepares the tabs and prints the secret for Vercel. */
function setup() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SECRET')) {
    props.setProperty('SECRET', (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''));
  }
  SpreadsheetApp.getActive().setSpreadsheetTimeZone('Asia/Dhaka');
  ordersTab_();
  productsTab_();
  couponsTab_();
  console.log('ORDERS_SECRET for Vercel: ' + props.getProperty('SECRET'));
}

/**
 * Run once from the editor before using the admin dashboard. It prints a second secret for the
 * Vercel setting ADMIN_SHEET_SECRET. Reports are refused without it, so the website's ordering
 * secret alone cannot read your whole order list.
 */
function setupAdmin() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('ADMIN_SECRET')) {
    props.setProperty('ADMIN_SECRET', (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''));
  }
  console.log('ADMIN_SHEET_SECRET for Vercel: ' + props.getProperty('ADMIN_SECRET'));
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply_({ error: 'bad request' });
  }
  const secret = PropertiesService.getScriptProperties().getProperty('SECRET');
  if (!secret || body.secret !== secret) return reply_({ error: 'forbidden' });
  // Admin dashboard actions need the second secret as well.
  if (['report', 'admin_products', 'update_product', 'admin_orders', 'update_order', 'admin_coupons', 'save_coupon'].indexOf(body.action) >= 0) {
    const admin = PropertiesService.getScriptProperties().getProperty('ADMIN_SECRET');
    if (!admin || body.admin !== admin) return reply_({ error: 'admin forbidden' });
    if (body.action === 'report') return reply_(report_());
    if (body.action === 'admin_products') return reply_(adminProducts_());
    if (body.action === 'admin_orders') return reply_(adminOrders_());
    if (body.action === 'admin_coupons') return reply_(adminCoupons_());
    if (body.action === 'save_coupon') return reply_(saveCoupon_(String(body.code || ''), body.expected || null, body.next || {}, String(body.by || '')));
    if (body.action === 'update_order') return reply_(updateOrder_(String(body.orderNo || ''), body.expected || {}, body.changes || {}, String(body.stock || ''), String(body.by || '')));
    return reply_(updateProduct_(String(body.id || ''), body.expected || {}, body.changes || {}, String(body.by || '')));
  }
  if (body.action === 'create') return reply_(create_(body.order || {}));
  if (body.action === 'track') return reply_(track_(String(body.orderNo || ''), String(body.phone || '')));
  if (body.action === 'history') return reply_(history_(String(body.email || '')));
  if (body.action === 'coupon') return reply_(coupon_(String(body.code || ''), Number(body.subtotal) || 0));
  if (body.action === 'catalog') return reply_(catalog_(Array.isArray(body.products) ? body.products : []));
  return reply_({ error: 'unknown action' });
}

function create_(o) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const lines = Array.isArray(o.lines) ? o.lines : [];
    // Final word on stock: the sheet, under the lock, so two customers cannot buy the last piece.
    const short = shortOfStock_(lines);
    if (short) return short;
    const sheet = ordersTab_();
    const col = columns_(sheet);
    const row = new Array(sheet.getLastColumn()).fill('');
    const put = (name, value) => { if (col[name] !== undefined) row[col[name]] = value; };
    put('Order no', text_(o.orderNo));
    put('Date', new Date());
    put('Status', 'New');
    put('Name', text_(o.name));
    // The apostrophe keeps the leading 0: Sheets would otherwise read the number as 1712345678.
    put('Mobile', "'" + String(o.phone || ''));
    put('Email', text_(o.email));
    put('District', text_(o.district));
    put('Area / thana', text_(o.area));
    put('Address', text_(o.address));
    put('Items', text_(o.items));
    put('Subtotal', Number(o.subtotal) || 0);
    put('Delivery', Number(o.delivery) || 0);
    put('Total', Number(o.total) || 0);
    put('Discount', Number(o.discount) || 0);
    put('Coupon', text_(o.coupon));
    put('Account', text_(o.account));
    put('Payment', text_(o.payment));
    put('Customer note', text_(o.note));
    sheet.appendRow(row);
    const added = sheet.getLastRow();
    const taken = takeStock_(lines);
    // What was taken from stock, so a cancelled order can be put back. "-" means nothing was counted.
    if (col['Lines'] !== undefined) sheet.getRange(added, col['Lines'] + 1).setValue(taken || '-');
  } finally {
    lock.releaseLock();
  }

  try {
    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      subject: 'New order ' + o.orderNo + ' · Tk ' + o.total,
      body: [
        'New website order ' + o.orderNo,
        '',
        o.items,
        '',
        'Subtotal: Tk ' + o.subtotal,
        'Delivery: Tk ' + o.delivery,
        Number(o.discount) > 0 ? 'Discount (' + o.coupon + '): - Tk ' + o.discount : '',
        'Total: Tk ' + o.total + ' (' + o.payment + ')',
        '',
        o.name + ', ' + o.phone + (o.email ? ', ' + o.email : ''),
        [o.address, o.area, o.district].filter(String).join(', '),
        o.note ? 'Note: ' + o.note : '',
        '',
        'Call the customer to confirm, then change Status in the sheet:',
        SpreadsheetApp.getActive().getUrl(),
      ].join('\n'),
    });
  } catch (err) {
    // The order is already saved. A failed alert email must not lose it.
    console.error('Order email failed: ' + err);
  }
  return { ok: true };
}

/** Returns an error when a counted piece has fewer left than ordered (pre-orders are never short). */
function shortOfStock_(lines) {
  if (!lines.length) return null;
  const sheet = productsTab_();
  const rows = sheet.getLastRow() - 1;
  if (rows < 1) return null;
  const col = columns_(sheet);
  if (col['Product Id'] === undefined || col['In Stock'] === undefined) return null;
  const values = sheet.getRange(2, 1, rows, sheet.getLastColumn()).getValues();
  for (const line of lines) {
    const row = values.find((r) => String(r[col['Product Id']]).trim() === String(line.id));
    if (!row) continue;
    const left = count_(row[col['In Stock']]);
    const preorder = col['Availability'] !== undefined && String(row[col['Availability']]).trim() === 'Pre-order';
    if (left !== null && !preorder && Number(line.quantity) > left) {
      return { error: 'stock', id: String(line.id), left: Math.max(0, left), name: String(row[col['Product Name']] || line.id) };
    }
  }
  return null;
}

/**
 * Lowers In Stock for each ordered piece, where you keep a count. Blank counts are left alone.
 * Returns what was lowered, as "product-id:2, other-id:1".
 */
function takeStock_(lines) {
  if (!lines.length) return '';
  const sheet = productsTab_();
  const rows = sheet.getLastRow() - 1;
  if (rows < 1) return '';
  const col = columns_(sheet);
  if (col['Product Id'] === undefined || col['In Stock'] === undefined) return '';
  const taken = [];
  const ids = sheet.getRange(2, col['Product Id'] + 1, rows, 1).getValues().map((r) => String(r[0]).trim());
  const stock = sheet.getRange(2, col['In Stock'] + 1, rows, 1);
  const counts = stock.getValues();
  lines.forEach((line) => {
    const i = ids.indexOf(String(line.id));
    const qty = Number(line.quantity) || 0;
    if (i < 0 || qty <= 0) return;
    const current = counts[i][0];
    if (current === '' || current === null || isNaN(Number(current))) return;
    counts[i][0] = Number(current) - qty;
    taken.push(String(line.id) + ':' + qty);
  });
  stock.setValues(counts);
  return taken.join(', ');
}

/**
 * The website sends its product list. Missing pieces are added as new rows, then
 * the public columns of every row are returned. Private columns never leave the sheet.
 */
function catalog_(products) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = productsTab_();
    const col = columns_(sheet);
    const width = sheet.getLastColumn();
    const known = {};
    const existing = sheet.getLastRow() - 1;
    if (existing > 0) {
      sheet.getRange(2, col['Product Id'] + 1, existing, 1).getValues()
        .forEach((r) => { known[String(r[0]).trim()] = true; });
    }
    products.forEach((p) => {
      const id = String(p.id || '').trim();
      if (!/^[a-z0-9ঀ-৿-]{1,120}$/.test(id) || known[id]) return;
      known[id] = true;
      const row = new Array(width).fill('');
      const put = (name, value) => { if (col[name] !== undefined) row[col[name]] = value; };
      put('Product Id', id);
      put('Product Name', text_(p.name));
      put('Category', text_(p.category));
      put('Colour / Size', text_(p.options));
      if (Number(p.price) > 0) put('Regular Price', Number(p.price));
      put('Availability', AVAILABILITY.indexOf(p.availability) >= 0 ? p.availability : 'Confirm by phone');
      put('Show on website', 'Yes');
      put('Image', text_(p.image));
      sheet.appendRow(row);
      const at = sheet.getLastRow();
      if (col['Profit Margin %'] !== undefined) sheet.getRange(at, col['Profit Margin %'] + 1).setFormula(marginFormula_(col, at));
    });

    const rows = sheet.getLastRow() - 1;
    const out = {};
    if (rows < 1) return { products: out };
    const values = sheet.getRange(2, 1, rows, sheet.getLastColumn()).getValues();
    const cell = (r, name) => (col[name] === undefined ? '' : r[col[name]]);
    values.forEach((r) => {
      const id = String(cell(r, 'Product Id')).trim();
      if (!id) return;
      out[id] = {
        name: String(cell(r, 'Product Name')).trim(),
        regular: positive_(cell(r, 'Regular Price')),
        promo: positive_(cell(r, 'Promo Price')),
        stock: count_(cell(r, 'In Stock')),
        availability: AVAILABILITY.indexOf(String(cell(r, 'Availability')).trim()) >= 0 ? String(cell(r, 'Availability')).trim() : '',
        show: !/^(no|n|false|0|hide|hidden)$/i.test(String(cell(r, 'Show on website')).trim()),
      };
    });
    return { products: out };
  } finally {
    lock.releaseLock();
  }
}

/** Coupons tab: Code, Type (percent or taka), Value, Minimum order, Active (Yes/No). Empty tab: no codes work. */
function couponsTab_() {
  const book = SpreadsheetApp.getActive();
  let sheet = book.getSheetByName('Coupons');
  if (!sheet) {
    sheet = book.insertSheet('Coupons');
    sheet.getRange(1, 1, 1, 5).setValues([['Code', 'Type', 'Value', 'Minimum order', 'Active']]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.getRange(2, 2, sheet.getMaxRows() - 1, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['percent', 'taka'], true).setAllowInvalid(false).build());
    sheet.getRange(2, 5, sheet.getMaxRows() - 1, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Yes', 'No'], true).setAllowInvalid(false).build());
  }
  return sheet;
}

function coupon_(code, subtotal) {
  const wanted = code.trim().toUpperCase();
  const sheet = couponsTab_();
  const rows = sheet.getLastRow() - 1;
  if (!wanted || rows < 1) return { error: 'invalid' };
  const col = columns_(sheet);
  const row = sheet.getRange(2, 1, rows, sheet.getLastColumn()).getValues()
    .find((r) => String(r[col['Code']]).trim().toUpperCase() === wanted);
  if (!row || String(row[col['Active']]).trim().toLowerCase() !== 'yes') return { error: 'invalid' };
  const value = Number(row[col['Value']]) || 0;
  const minimum = Number(row[col['Minimum order']]) || 0;
  if (value <= 0) return { error: 'invalid' };
  if (subtotal < minimum) return { error: 'minimum', minimum: minimum };
  const off = String(row[col['Type']]).trim().toLowerCase() === 'percent' ? Math.floor((subtotal * Math.min(value, 100)) / 100) : value;
  return { ok: true, code: wanted, discount: Math.min(off, subtotal) };
}

function track_(orderNo, phone) {
  const sheet = ordersTab_();
  const rows = sheet.getLastRow() - 1;
  if (rows < 1) return { error: 'not found' };
  const col = columns_(sheet);
  const values = sheet.getRange(2, 1, rows, sheet.getLastColumn()).getDisplayValues();
  const wanted = orderNo.trim().toUpperCase();
  const row = values.find((r) => String(r[col['Order no']]).trim().toUpperCase() === wanted);
  // The whole mobile number must match, so nobody can look up someone else's order.
  if (!row || mobile_(row[col['Mobile']]) !== mobile_(phone) || !mobile_(phone)) return { error: 'not found' };
  return {
    orderNo: row[col['Order no']],
    date: row[col['Date']],
    status: row[col['Status']],
    items: row[col['Items']],
    total: row[col['Total']],
    district: row[col['District']],
    message: col['Message for customer'] === undefined ? '' : row[col['Message for customer']],
  };
}

/** Orders placed while signed in with this email, or typed with it at checkout. Newest first. */
function history_(email) {
  const wanted = email.trim().toLowerCase();
  const sheet = ordersTab_();
  const rows = sheet.getLastRow() - 1;
  if (!wanted || rows < 1) return { orders: [] };
  const col = columns_(sheet);
  const cell = (r, name) => (col[name] === undefined ? '' : String(r[col[name]]));
  const mine = (r) => [cell(r, 'Account'), cell(r, 'Email')].some((v) => v.trim().toLowerCase() === wanted);
  return {
    orders: sheet.getRange(2, 1, rows, sheet.getLastColumn()).getDisplayValues()
      .filter(mine).reverse().slice(0, 30)
      .map((r) => ({ orderNo: cell(r, 'Order no'), date: cell(r, 'Date'), status: cell(r, 'Status'), items: cell(r, 'Items'), total: cell(r, 'Total') })),
  };
}

/**
 * For the admin dashboard. Only reads: it never creates tabs, adds columns or changes cells.
 * Names, phone numbers, emails, addresses, notes and cost prices are not sent.
 */
function report_() {
  const book = SpreadsheetApp.getActive();
  const read = (tab) => {
    const sheet = book.getSheetByName(tab);
    if (!sheet || sheet.getLastRow() < 2) return [];
    const col = columns_(sheet);
    return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues()
      .map((r) => (name) => (col[name] === undefined ? '' : r[col[name]]));
  };
  const text = (v) => String(v).trim();
  const money = (v) => { const n = Number(v); return isFinite(n) ? n : 0; };
  const date = (v) => {
    const d = Object.prototype.toString.call(v) === '[object Date]' ? v : new Date(String(v));
    return isNaN(d.getTime()) ? '' : d.toISOString();
  };
  const orders = read(TAB).filter((c) => text(c('Order no'))).slice(-5000).map((c) => ({
    orderNo: text(c('Order no')),
    date: date(c('Date')),
    status: text(c('Status')),
    items: text(c('Items')),
    subtotal: money(c('Subtotal')),
    delivery: money(c('Delivery')),
    discount: money(c('Discount')),
    total: money(c('Total')),
    coupon: text(c('Coupon')),
    district: text(c('District')),
    // Only the method, never the transaction ID.
    payment: text(c('Payment')).split(' · ')[0],
  }));
  const products = read(PRODUCTS_TAB).filter((c) => text(c('Product Id'))).map((c) => ({
    id: text(c('Product Id')),
    name: text(c('Product Name')),
    regular: positive_(c('Regular Price')),
    promo: positive_(c('Promo Price')),
    stock: count_(c('In Stock')),
    show: !/^(no|n|false|0|hide|hidden)$/i.test(text(c('Show on website'))),
  }));
  return { ok: true, orders: orders, products: products };
}

// The product cells the admin dashboard may change. Cost Price, Margin and Notes are never touched.
const EDITABLE = {
  name: 'Product Name', regular: 'Regular Price', promo: 'Promo Price', stock: 'In Stock',
  availability: 'Availability', show: 'Show on website',
};

function productValues_(cell) {
  return {
    name: String(cell('Product Name')).trim(),
    regular: positive_(cell('Regular Price')),
    promo: positive_(cell('Promo Price')),
    stock: count_(cell('In Stock')),
    availability: String(cell('Availability')).trim(),
    show: !/^(no|n|false|0|hide|hidden)$/i.test(String(cell('Show on website')).trim()),
  };
}

/** For the admin Products screen. Only reads. */
function adminProducts_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(PRODUCTS_TAB);
  if (!sheet || sheet.getLastRow() < 2) return { ok: true, products: [] };
  const col = columns_(sheet);
  const products = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues().map((r) => {
    const cell = (name) => (col[name] === undefined ? '' : r[col[name]]);
    const p = productValues_(cell);
    p.id = String(cell('Product Id')).trim();
    p.category = String(cell('Category')).trim();
    p.image = String(cell('Image')).trim();
    return p;
  }).filter((p) => p.id);
  return { ok: true, products: products };
}

function validProduct_(p) {
  const whole = (v, min, max) => v === null || (typeof v === 'number' && Math.floor(v) === v && v >= min && v <= max);
  if (typeof p.name !== 'string' || !p.name.trim() || p.name.length > 120 || /[\u0000-\u001f]/.test(p.name)) return 'name';
  if (!whole(p.regular, 1, 10000000)) return 'regular';
  if (!whole(p.promo, 1, 10000000) || (p.promo !== null && (p.regular === null || p.promo >= p.regular))) return 'promo';
  // Below 0 happens when pre-orders are taken with nothing in stock.
  if (!whole(p.stock, -10000, 100000)) return 'stock';
  if (p.availability !== '' && AVAILABILITY.indexOf(p.availability) < 0) return 'availability';
  if (typeof p.show !== 'boolean') return 'show';
  return '';
}

/**
 * Changes some cells of one product. `expected` holds what the admin saw: if a cell being changed
 * is different now (for example an order lowered the stock), nothing is written.
 */
function updateProduct_(id, expected, changes, by) {
  const fields = Object.keys(changes).filter((f) => EDITABLE.hasOwnProperty(f));
  if (!id || !fields.length || fields.length !== Object.keys(changes).length) return { error: 'bad request' };
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = productsTab_();
    const col = columns_(sheet);
    if (col['Product Id'] === undefined || fields.some((f) => col[EDITABLE[f]] === undefined)) return { error: 'missing column' };
    const rows = sheet.getLastRow() - 1;
    if (rows < 1) return { error: 'not found' };
    const values = sheet.getRange(2, 1, rows, sheet.getLastColumn()).getValues();
    const matches = values.map((r, i) => i).filter((i) => String(values[i][col['Product Id']]).trim() === id);
    if (!matches.length) return { error: 'not found' };
    if (matches.length > 1) return { error: 'duplicate' };
    const at = matches[0];
    const current = productValues_((name) => (col[name] === undefined ? '' : values[at][col[name]]));
    current.id = id;
    if (fields.some((f) => expected[f] !== current[f])) return { error: 'conflict', product: current };

    const next = Object.assign({}, current);
    fields.forEach((f) => { next[f] = typeof changes[f] === 'string' ? changes[f].trim() : changes[f]; });
    // Cells you typed yourself and that are not being changed are not judged.
    const check = Object.assign({ regular: null, promo: null }, next);
    if (fields.indexOf('name') < 0) check.name = 'unchanged';
    if (fields.indexOf('availability') < 0) check.availability = '';
    if (fields.indexOf('stock') < 0) check.stock = null;
    if (fields.indexOf('regular') < 0 && fields.indexOf('promo') < 0) { check.regular = null; check.promo = null; }
    const wrong = validProduct_(check);
    if (wrong) return { error: 'invalid', field: wrong };

    const log = activityTab_();
    fields.forEach((f) => {
      if (next[f] === current[f]) return;
      const show = (v) => (typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v === null ? '' : v);
      const write = typeof next[f] === 'string' ? text_(next[f]) : show(next[f]);
      sheet.getRange(at + 2, col[EDITABLE[f]] + 1).setValue(write);
      const kept = (v) => (typeof v === 'string' ? text_(v) : v);
      log.appendRow([new Date(), text_(by), id, EDITABLE[f], kept(show(current[f])), kept(show(next[f]))]);
    });
    return { ok: true, product: next };
  } finally {
    lock.releaseLock();
  }
}

/** For the admin Coupons screen. Only reads: it never creates the tab or changes cells. */
function adminCoupons_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Coupons');
  if (!sheet || sheet.getLastRow() < 2) return { ok: true, coupons: [] };
  const col = columns_(sheet);
  const coupons = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues()
    .map((r) => couponValues_((name) => (col[name] === undefined ? '' : r[col[name]])))
    .filter((c) => c.code);
  return { ok: true, coupons: coupons };
}

function couponValues_(cell) {
  return {
    code: String(cell('Code')).trim().toUpperCase(),
    type: String(cell('Type')).trim().toLowerCase(),
    value: Number(cell('Value')) || 0,
    minimum: Number(cell('Minimum order')) || 0,
    active: String(cell('Active')).trim().toLowerCase() === 'yes',
  };
}

/**
 * Adds a coupon (`expected` is null) or changes one. Codes are never deleted or renamed.
 * `expected` holds what the admin saw: if the row differs now, nothing is written.
 */
function saveCoupon_(code, expected, next, by) {
  const names = { type: 'Type', value: 'Value', minimum: 'Minimum order', active: 'Active' };
  const fields = Object.keys(names);
  const whole = (v, min, max) => typeof v === 'number' && Math.floor(v) === v && v >= min && v <= max;
  if (typeof next !== 'object' || Object.keys(next).some((f) => !names.hasOwnProperty(f))) return { error: 'bad request' };
  if (typeof next.active !== 'boolean') return { error: 'invalid', field: 'active' };
  // Switching a code off is always allowed, even if its other cells were typed wrongly by hand.
  const offOnly = !!expected && !next.active && ['type', 'value', 'minimum'].every((f) => next[f] === expected[f]);
  if (!offOnly) {
    if (next.type !== 'percent' && next.type !== 'taka') return { error: 'invalid', field: 'type' };
    if (!whole(next.value, 1, next.type === 'percent' ? 100 : 1000000)) return { error: 'invalid', field: 'value' };
    if (!whole(next.minimum, 0, 10000000)) return { error: 'invalid', field: 'minimum' };
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = couponsTab_();
    const col = columns_(sheet);
    if (col['Code'] === undefined || fields.some((f) => col[names[f]] === undefined)) return { error: 'missing column' };
    const rows = sheet.getLastRow() - 1;
    const values = rows < 1 ? [] : sheet.getRange(2, 1, rows, sheet.getLastColumn()).getValues();
    const matches = values.map((r, i) => i).filter((i) => String(values[i][col['Code']]).trim().toUpperCase() === code);
    if (matches.length > 1) return { error: 'duplicate' };
    const read = (r) => couponValues_((name) => (col[name] === undefined ? '' : r[col[name]]));
    const current = matches.length ? read(values[matches[0]]) : null;
    const cellFor = (f, v) => (f === 'active' ? (v ? 'Yes' : 'No') : v);
    const log = activityTab_();
    const record = (field, from, to) => log.appendRow([new Date(), text_(by), text_(code), field, from, to]);

    if (!expected) {
      // New codes start with a letter, so a code can never be read as a formula or a number.
      if (!/^[A-Z][A-Z0-9_-]{1,29}$/.test(code)) return { error: 'invalid', field: 'code' };
      if (current) return { error: 'exists', coupon: current };
      const row = sheet.getLastRow() + 1;
      // Plain text, so a code such as DEC25 is not turned into a date.
      sheet.getRange(row, col['Code'] + 1).setNumberFormat('@').setValue(code);
      fields.forEach((f) => sheet.getRange(row, col[names[f]] + 1).setValue(cellFor(f, next[f])));
      record('Coupon created', '', next.type + ' ' + next.value + ', minimum ' + next.minimum + ', ' + (next.active ? 'on' : 'off'));
    } else {
      if (!current) return { error: 'not found' };
      if (fields.some((f) => expected[f] !== current[f])) return { error: 'conflict', coupon: current };
      fields.forEach((f) => {
        if (next[f] === current[f]) return;
        sheet.getRange(matches[0] + 2, col[names[f]] + 1).setValue(cellFor(f, next[f]));
        const was = cellFor(f, current[f]);
        record('Coupon ' + names[f], typeof was === 'string' ? text_(was) : was, cellFor(f, next[f]));
      });
    }
    return { ok: true, coupon: Object.assign({ code: code }, next) };
  } finally {
    lock.releaseLock();
  }
}

/** Who changed what in the admin dashboard, and when. */
function activityTab_() {
  const book = SpreadsheetApp.getActive();
  let sheet = book.getSheetByName('Activity');
  if (!sheet) {
    sheet = book.insertSheet('Activity');
    sheet.getRange(1, 1, 1, 6).setValues([['Date', 'Admin', 'Product Id', 'Field', 'Old value', 'New value']]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** For the admin Orders screens, which need the customer's details. Only reads. */
function adminOrders_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(TAB);
  if (!sheet || sheet.getLastRow() < 2) return { ok: true, orders: [] };
  const col = columns_(sheet);
  const orders = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues()
    .map((r) => orderValues_((name) => (col[name] === undefined ? '' : r[col[name]])))
    .filter((o) => o.orderNo)
    .slice(-2000);
  return { ok: true, orders: orders };
}

function orderValues_(cell) {
  // A leading apostrophe only tells Sheets "this is text".
  const text = (name) => String(cell(name)).replace(/^'/, '').trim();
  const money = (name) => { const n = Number(cell(name)); return isFinite(n) ? n : 0; };
  const raw = cell('Date');
  const date = Object.prototype.toString.call(raw) === '[object Date]' ? raw : new Date(String(raw));
  return {
    orderNo: text('Order no'),
    date: isNaN(date.getTime()) ? '' : date.toISOString(),
    status: text('Status'),
    name: text('Name'),
    mobile: text('Mobile'),
    email: text('Email'),
    district: text('District'),
    area: text('Area / thana'),
    address: text('Address'),
    items: text('Items'),
    subtotal: money('Subtotal'),
    delivery: money('Delivery'),
    discount: money('Discount'),
    total: money('Total'),
    coupon: text('Coupon'),
    payment: text('Payment'),
    note: text('Customer note'),
    message: text('Message for customer'),
    lines: text('Lines'),
    stockReturned: /^yes$/i.test(text('Stock returned')),
  };
}

/**
 * Changes an order's status and customer message, and puts its stock back (or takes it again).
 * `expected` holds what the admin saw: if the sheet differs now, nothing is written.
 */
function updateOrder_(orderNo, expected, changes, stock, by) {
  const names = { status: 'Status', message: 'Message for customer' };
  const fields = Object.keys(changes);
  if (!orderNo || ['', 'return', 'take'].indexOf(stock) < 0 || (!fields.length && !stock) || fields.some((f) => !names.hasOwnProperty(f))) return { error: 'bad request' };
  if (fields.indexOf('status') >= 0 && STATUSES.indexOf(changes.status) < 0) return { error: 'invalid', field: 'status' };
  if (fields.indexOf('message') >= 0 && (typeof changes.message !== 'string' || changes.message.length > 300)) return { error: 'invalid', field: 'message' };
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = ordersTab_();
    const col = columns_(sheet);
    if (col['Order no'] === undefined || fields.some((f) => col[names[f]] === undefined)) return { error: 'missing column' };
    const rows = sheet.getLastRow() - 1;
    if (rows < 1) return { error: 'not found' };
    const values = sheet.getRange(2, 1, rows, sheet.getLastColumn()).getValues();
    const matches = values.map((r, i) => i).filter((i) => String(values[i][col['Order no']]).trim() === orderNo);
    if (!matches.length) return { error: 'not found' };
    if (matches.length > 1) return { error: 'duplicate' };
    const at = matches[0];
    const read = () => orderValues_((name) => (col[name] === undefined ? '' : values[at][col[name]]));
    const current = read();
    if (fields.some((f) => expected[f] !== current[f]) || (stock && (expected.status !== current.status || expected.stockReturned !== current.stockReturned))) {
      return { error: 'conflict', order: current };
    }
    const status = fields.indexOf('status') >= 0 ? changes.status : current.status;
    const closed = status === 'Cancelled' || status === 'Returned';
    const pieces = current.lines.split(',').map((part) => part.trim().match(/^(.+):(\d+)$/)).filter(Boolean)
      .map((m) => ({ id: m[1], quantity: Number(m[2]) }));
    if (stock === 'return' && (!closed || current.stockReturned || !pieces.length)) return { error: 'stock not allowed' };
    if (stock === 'take' && (closed || !current.stockReturned || !pieces.length)) return { error: 'stock not allowed' };

    const log = activityTab_();
    const record = (what, field, from, to) => log.appendRow([new Date(), text_(by), text_(what), field, typeof from === 'string' ? text_(from) : from, typeof to === 'string' ? text_(to) : to]);
    const write = (name, value) => {
      sheet.getRange(at + 2, col[name] + 1).setValue(value);
      values[at][col[name]] = value;
    };
    fields.forEach((f) => {
      const next = String(changes[f]).trim();
      if (next === current[f]) return;
      write(names[f], text_(next));
      record(orderNo, f === 'status' ? 'Order status' : 'Customer message', current[f], next);
    });
    const moved = [];
    const skipped = [];
    if (stock) {
      const products = productsTab_();
      const pc = columns_(products);
      const count = products.getLastRow() - 1;
      const ids = count < 1 ? [] : products.getRange(2, pc['Product Id'] + 1, count, 1).getValues().map((r) => String(r[0]).trim());
      pieces.forEach((piece) => {
        const i = ids.indexOf(piece.id);
        const cell = i < 0 ? null : products.getRange(i + 2, pc['In Stock'] + 1);
        const have = cell ? cell.getValues()[0][0] : '';
        // Removed products and blank (uncounted) stock are left alone.
        if (!cell || have === '' || isNaN(Number(have))) { skipped.push(piece.id); return; }
        const after = Number(have) + (stock === 'return' ? piece.quantity : -piece.quantity);
        cell.setValue(after);
        record(piece.id, 'In Stock (order ' + orderNo + ')', Number(have), after);
        moved.push({ id: piece.id, from: Number(have), to: after });
      });
      write('Stock returned', stock === 'return' ? 'Yes' : '');
    }
    return { ok: true, order: read(), moved: moved, skipped: skipped };
  } finally {
    lock.releaseLock();
  }
}

function ordersTab_() {
  const book = SpreadsheetApp.getActive();
  let sheet = book.getSheetByName(TAB);
  if (!sheet) {
    sheet = book.insertSheet(TAB, 0);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    // Mobile numbers keep their leading 0.
    sheet.getRange(2, HEADERS.indexOf('Mobile') + 1, sheet.getMaxRows() - 1, 1).setNumberFormat('@');
    sheet.getRange(2, HEADERS.indexOf('Date') + 1, sheet.getMaxRows() - 1, 1).setNumberFormat('d mmm yyyy, h:mm am/pm');
    const statusRule = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(true).build();
    sheet.getRange(2, HEADERS.indexOf('Status') + 1, sheet.getMaxRows() - 1, 1).setDataValidation(statusRule);
    sheet.setColumnWidth(HEADERS.indexOf('Items') + 1, 320);
    sheet.setColumnWidth(HEADERS.indexOf('Address') + 1, 240);
  }
  // Columns added by later versions go on the end, so your own layout is untouched.
  const have = columns_(sheet);
  ['Discount', 'Coupon', 'Account', 'Lines', 'Stock returned'].forEach((name) => {
    if (have[name] === undefined) sheet.getRange(1, sheet.getLastColumn() + 1).setValue(name).setFontWeight('bold');
  });
  return sheet;
}

function productsTab_() {
  const book = SpreadsheetApp.getActive();
  let sheet = book.getSheetByName(PRODUCTS_TAB);
  if (!sheet) {
    sheet = book.insertSheet(PRODUCTS_TAB, 1);
    const at = (name) => PRODUCT_HEADERS.indexOf(name) + 1;
    const below = (name) => sheet.getRange(2, at(name), sheet.getMaxRows() - 1, 1);
    sheet.getRange(1, 1, 1, PRODUCT_HEADERS.length).setValues([PRODUCT_HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(2);
    sheet.getRange(1, at('Product Id')).setNote('Matches the piece on the website. Do not change it.');
    sheet.getRange(1, at('Regular Price')).setNote('Price in taka. Empty or 0 shows Stock Out.');
    sheet.getRange(1, at('Promo Price')).setNote('Sale price in taka. Must be lower than the Regular Price. Leave empty for no sale.');
    sheet.getRange(1, at('In Stock')).setNote('How many you have. Empty or 0 shows Stock Out. Under 5 shows Low Stock. Each order lowers it.');
    sheet.getRange(1, at('Show on website')).setNote('No hides the piece from the website.');
    sheet.getRange(1, at('Cost Price')).setNote('Private. Never shown on the website.');
    ['Regular Price', 'Promo Price', 'Cost Price'].forEach((name) => below(name).setNumberFormat('#,##0'));
    below('In Stock').setNumberFormat('0');
    below('Profit Margin %').setNumberFormat('0%');
    below('Availability').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(AVAILABILITY, true).setAllowInvalid(false).build());
    below('Show on website').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Yes', 'No'], true).setAllowInvalid(false).build());
    // Light colours mark what the website reads (gold) and what stays private (grey).
    ['Regular Price', 'Promo Price', 'In Stock', 'Availability', 'Show on website'].forEach((name) => sheet.getRange(1, at(name)).setBackground('#F3E9D2'));
    ['Cost Price', 'Profit Margin %', 'Notes'].forEach((name) => sheet.getRange(1, at(name)).setBackground('#E8E8E8'));
    sheet.setColumnWidth(at('Product Id'), 200);
    sheet.setColumnWidth(at('Product Name'), 240);
  }
  return sheet;
}

function marginFormula_(col, row) {
  const ref = (name) => SpreadsheetApp.getActive().getSheetByName(PRODUCTS_TAB).getRange(row, col[name] + 1).getA1Notation();
  const price = 'IF(N(' + ref('Promo Price') + ')>0,' + ref('Promo Price') + ',' + ref('Regular Price') + ')';
  return '=IF(AND(N(' + ref('Regular Price') + ')>0,N(' + ref('Cost Price') + ')>0),(' + price + '-' + ref('Cost Price') + ')/' + price + ',"")';
}

/** Finds columns by their heading, so moving or adding columns in the sheet is safe. */
function columns_(sheet) {
  const heads = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const col = {};
  heads.forEach((h, i) => { col[String(h).trim()] = i; });
  return col;
}

function positive_(value) {
  const n = Number(String(value).replace(/[^\d.]/g, ''));
  return value !== '' && isFinite(n) && n > 0 ? n : null;
}

function count_(value) {
  if (value === '' || value === null) return null;
  const n = Number(value);
  return isFinite(n) ? Math.floor(n) : null;
}

/** Stops text typed by a customer from being run as a spreadsheet formula. */
function text_(value) {
  const s = String(value == null ? '' : value);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function mobile_(value) {
  const digits = String(value).replace(/\D/g, '').replace(/^(880|88)?0?(?=1[3-9]\d{8}$)/, '');
  return /^1[3-9]\d{8}$/.test(digits) ? digits : '';
}

function reply_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
