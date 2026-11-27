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
  console.log('ORDERS_SECRET for Vercel: ' + props.getProperty('SECRET'));
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
  if (body.action === 'create') return reply_(create_(body.order || {}));
  if (body.action === 'track') return reply_(track_(String(body.orderNo || ''), String(body.phone || '')));
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
    put('Payment', text_(o.payment));
    put('Customer note', text_(o.note));
    sheet.appendRow(row);
    takeStock_(lines);
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

/** Lowers In Stock for each ordered piece, where you keep a count. Blank counts are left alone. */
function takeStock_(lines) {
  if (!lines.length) return;
  const sheet = productsTab_();
  const rows = sheet.getLastRow() - 1;
  if (rows < 1) return;
  const col = columns_(sheet);
  if (col['Product Id'] === undefined || col['In Stock'] === undefined) return;
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
  });
  stock.setValues(counts);
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
    sheet.getRange(1, at('Regular Price')).setNote('Price in taka. Empty means "Price coming soon" and the piece cannot be ordered.');
    sheet.getRange(1, at('Promo Price')).setNote('Sale price in taka. Must be lower than the Regular Price. Leave empty for no sale.');
    sheet.getRange(1, at('In Stock')).setNote('How many you have. 0 shows Sold out (unless Availability is Pre-order). Each order lowers it. Leave empty if you do not count.');
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
