/**
 * Revasser order sheet.
 *
 * The website sends each order here. This script writes it as a row in the
 * "Orders" tab and emails you. Track Order on the website reads the Status
 * column, so change Status as the order moves.
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

/** Run once from the editor. It prepares the tab and prints the secret for Vercel. */
function setup() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SECRET')) {
    props.setProperty('SECRET', (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''));
  }
  SpreadsheetApp.getActive().setSpreadsheetTimeZone('Asia/Dhaka');
  ordersTab_();
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
  return reply_({ error: 'unknown action' });
}

function create_(o) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = ordersTab_();
    const col = columns_(sheet);
    const row = new Array(sheet.getLastColumn()).fill('');
    const put = (name, value) => { if (col[name] !== undefined) row[col[name]] = value; };
    put('Order no', text_(o.orderNo));
    put('Date', new Date());
    put('Status', 'New');
    put('Name', text_(o.name));
    put('Mobile', text_(o.phone));
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

/** Finds columns by their heading, so moving or adding columns in the sheet is safe. */
function columns_(sheet) {
  const heads = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const col = {};
  heads.forEach((h, i) => { col[String(h).trim()] = i; });
  return col;
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
