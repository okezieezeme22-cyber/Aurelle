# Connecting AURÉLLE to Supabase

The site is still plain HTML, CSS and JavaScript. Nothing about how it looks or behaves changed.
Only where the data lives: products, stock, orders, accounts, reviews and the newsletter list now
live in Supabase instead of the visitor's browser.

## 1. Create the tables (once)

> Already done for the **Aurelle** project (ref `dpaamsqwtilrlbmlbwew`): the tables and the 15 demo products are in place. Use these steps only for a fresh project.

1. Open your Supabase project, then **SQL Editor > New query**.
2. Paste the whole of `supabase/migrations/20261106000001_aurelle_schema.sql` and press **Run**.
3. New query again. Paste `supabase/seed.sql` (the 15 demo products and their 102 size/colour variants) and **Run**.
4. Apply `supabase/migrations/20261110000002_add_category_products.sql` to add the first products and their variants across all five categories.
5. Apply `supabase/migrations/20261110000003_add_mens_image_products.sql` to add the products made from the supplied men's images.
6. Apply `supabase/migrations/20261110000004_add_womens_image_products.sql` to add products made from the latest supplied women's images.
   The seed and catalogue migrations are safe to run more than once.

The existing Aurelle project already has the schema and original seed data. To update it, run any
new catalogue migrations you have not applied in **SQL Editor**, in numeric order. The browser
catalogue is a fallback; the storefront and admin use the database catalogue whenever Supabase is connected.

## 2. Connect the site

1. **Project Settings > API**. Copy the **Project URL** and the **publishable** (anon) key.
2. Paste them into `js/supabase-config.js` (already filled in for the Aurelle project).
   These two values are public by design. **Never** put the `service_role` / secret key in this repository.

## 3. Authentication settings

**Authentication > URL Configuration**
- *Site URL*: your live address (for example `https://your-name.github.io/aurelle/`).
- *Redirect URLs*: add `https://your-name.github.io/aurelle/forgot.html`
  and, for local testing, `http://localhost:PORT/forgot.html`.
  Without this, the password-reset email link will not work.

**Authentication > Providers > Email > Confirm email**
- On: new customers must click an emailed link first. The register page already tells them to check their inbox.
- Off: customers are signed in straight after registering. Easiest for a portfolio demo.
- Supabase's built-in email sender is limited to a few emails an hour. For a live store, add your own SMTP
  (**Authentication > Emails > SMTP Settings**).

## 4. Make yourself the admin

Nobody can register as an admin. The role is set only in the database.

1. Register a normal account on the site (`register.html`) with your own email.
2. In the SQL Editor run:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
3. Sign in at `admin/login.html`.

## 5. What the database enforces (Row Level Security)

| Who | Can |
|---|---|
| Anyone | Read published products, their variants and stock, and reviews. Subscribe to the newsletter. Place an order. |
| A signed-in customer | Read and edit only their own profile (name, phone, addresses). Read only their own orders. Review a product only after one of their own orders containing it is Delivered. |
| An admin | Read all orders, customers and the inventory log. Change prices and publishing. Change order status, verify payments, record refunds and adjust stock, but only through the `admin_*` database functions. |
| Nobody, from the browser | Change a role, edit prices on an order, mark a payment as paid, or change stock directly. |

Orders are created by the `place_order` database function. The browser sends only SKUs and quantities.
The database looks up the prices, checks and reduces stock in one locked transaction, works out delivery, and
returns the order. So prices, totals and stock cannot be forged from the browser, and two buyers cannot
oversell the last item.

## 6. Know these limits

- **No real payments yet.** Orders are saved as "Pending payment". Paystack verification (server side, with a signed
  webhook) is the next step and needs a Supabase Edge Function so the secret key is never in the browser.
- **Unpaid orders hold stock** until an admin cancels them (cancelling puts the stock back exactly once).
- **Delivery fees** are decided in the database (`private.delivery_fee`). If you change the fees, change them there and in
  `js/checkout-config.js` so the checkout preview matches.
- **Guest orders** (placed without an account) are saved, but only admins can read them later. Customers see
  orders placed while signed in.
- **Sample data** in the admin writes clearly marked demo orders (`AUR-DEMO-...`) that never touch stock and
  are removed with one click.
- Run **Advisors** (Supabase dashboard > Advisors) after any future table change to catch a missing RLS policy.
