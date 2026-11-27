# Website orders → Google Sheet

Every order placed on revasserbd.shop becomes a row in your Google Sheet, and you get an email.
Track Order on the website shows the **Status** you set in the sheet.

## One-time setup (about 10 minutes)

1. Sign in to Google as revasserbd@gmail.com and create a new Google Sheet named **Revasser Orders**.
2. In the sheet: **Extensions → Apps Script**. Delete what is there, paste everything from `Code.gs`, and press **Save**.
3. Choose **setup** in the function menu at the top and press **Run**. Google asks for permission: allow it.
   (Google may say the app is unverified, because it is your own script. Choose *Advanced → Go to project*.)
   The log at the bottom prints `ORDERS_SECRET for Vercel: …`.
   The same code is easier to copy from **Project Settings (gear icon) → Script Properties → SECRET**:
   click Edit script properties, click the value, Cmd+A, Cmd+C.
4. **Deploy → New deployment →** gear icon **→ Web app**.
   *Execute as:* **Me**. *Who has access:* **Anyone**. Press **Deploy** and copy the **Web app URL**
   (it starts with `https://script.google.com/macros/s/` and ends with `/exec`).
5. In Vercel: project **revasser-bd → Settings → Environment Variables**, add two variables for
   **Production** and **Preview**:
   - `ORDERS_SCRIPT_URL` = the Web app URL from step 4
   - `ORDERS_SECRET` = the long secret from step 3
   Choose type **Secret** for both. Check both names appear in the list after Save.
6. Redeploy (Vercel → Deployments → ⋯ → Redeploy) so the site picks them up. A new commit also does it.

Never paste the secret into a chat, a file in this repository, or Pages CMS.

## Daily use

- New order → email "New order R…" arrives, and a row with Status **New** appears.
- Call the customer, then set Status: **Confirmed → Shipped → Delivered** (or **Cancelled / Returned**).
- **Message for customer** (last column) is shown on Track Order, for example the courier and the day.
- You can add your own columns or move columns. The script finds them by their heading, so keep the
  heading names the same.

## If you change Code.gs later

Deploy → **Manage deployments** → edit (pencil) → Version: **New version** → Deploy. The URL stays the same.

## Admin dashboard (reports)

The dashboard at `/admin` reads orders and stock. It does not change the sheet.

1. Paste the new `Code.gs`, **Save**, choose **setupAdmin** and press **Run**.
2. Copy the secret from **Project Settings → Script Properties → ADMIN_SECRET**.
3. Vercel → Environment Variables → add `ADMIN_SHEET_SECRET` (type **Secret**) for Production and Preview.
4. **Deploy → Manage deployments →** pencil → Version: **New version** → Deploy.

Never paste either secret into a chat or a file in this repository.

The dashboard reads the sheet each time you open it, so reload to see new orders.
