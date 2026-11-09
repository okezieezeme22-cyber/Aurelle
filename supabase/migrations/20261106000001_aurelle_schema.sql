-- AURÉLLE database schema, access rules (RLS) and server-side order logic.
-- Run once in the Supabase SQL editor, or with `supabase db push`.
-- Money is stored as integers in kobo (₦1 = 100 kobo), the same as the storefront.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  name       text not null default '' check (char_length(name) <= 120),
  phone      text not null default '' check (char_length(phone) <= 30),
  role       text not null default 'customer' check (role in ('customer', 'admin')),
  status     text not null default 'active'   check (status in ('active', 'suspended')),
  addresses  jsonb not null default '[]'::jsonb
             check (jsonb_typeof(addresses) = 'array' and jsonb_array_length(addresses) <= 10),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- True only for an active admin. Roles live in this table, never in anything a user can edit.
create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin' and p.status = 'active'
  );
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

-- Every new sign-up gets a customer profile. The role is never read from sign-up data.
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, name, phone)
  values (new.id, lower(new.email),
          left(coalesce(new.raw_user_meta_data ->> 'name', ''), 120),
          left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 30));
  return new;
end $$;
revoke all on function private.handle_new_user() from public;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- Customers can edit their own name, phone and addresses, but never their role, status or email.
create or replace function private.guard_profile_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then return new; end if;          -- SQL editor / service role
  if private.is_admin() then
    if new.id <> old.id or new.role <> old.role or new.email <> old.email then
      raise exception 'Role, email and id can only be changed in the SQL editor.';
    end if;
  elsif new.id <> old.id or new.role <> old.role or new.status <> old.status or new.email <> old.email then
    raise exception 'You cannot change that field.';
  end if;
  return new;
end $$;
revoke all on function private.guard_profile_update() from public;
create trigger profiles_guard before update on public.profiles
  for each row execute function private.guard_profile_update();

create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.is_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) or private.is_admin())
  with check (id = (select auth.uid()) or private.is_admin());

-- ---------------------------------------------------------------- catalogue
create table public.products (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name          text not null check (char_length(name) between 1 and 160),
  category      text not null check (category in ('women', 'men', 'bags', 'footwear', 'accessories')),
  price         integer not null check (price > 0),
  compare_price integer check (compare_price is null or compare_price > price),
  image         text not null,
  best_seller   boolean not null default false,
  is_new        boolean not null default false,
  sold          integer not null default 0 check (sold >= 0),
  published     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index products_published_idx on public.products (published, created_at desc);
alter table public.products enable row level security;

create or replace function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
create trigger products_touch before update on public.products
  for each row execute function private.touch_updated_at();

create table public.product_variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku        text not null unique,
  size       text not null,
  colour     text not null,
  position   smallint not null default 0,
  stock      integer not null default 0 check (stock >= 0),
  unique (product_id, size, colour)
);
create index product_variants_product_idx on public.product_variants (product_id, position);
alter table public.product_variants enable row level security;

create policy products_read on public.products for select to anon, authenticated
  using (published or private.is_admin());
create policy products_insert on public.products for insert to authenticated
  with check (private.is_admin());
create policy products_update on public.products for update to authenticated
  using (private.is_admin()) with check (private.is_admin());
create policy products_delete on public.products for delete to authenticated
  using (private.is_admin());

-- Variant stock is read-only from the browser. Only the order and admin functions below change it.
create policy variants_read on public.product_variants for select to anon, authenticated
  using (private.is_admin() or exists (select 1 from public.products p where p.id = product_id and p.published));

create table public.inventory_log (
  id       bigint generated always as identity primary key,
  sku      text not null,
  product  text not null,
  change   integer not null,
  from_qty integer not null,
  to_qty   integer not null,
  reason   text not null,
  by_email text not null,
  at       timestamptz not null default now()
);
create index inventory_log_at_idx on public.inventory_log (at desc);
alter table public.inventory_log enable row level security;
create policy inventory_log_read on public.inventory_log for select to authenticated
  using (private.is_admin());

-- ---------------------------------------------------------------- orders
create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  ref            text not null unique,
  user_id        uuid references auth.users (id) on delete set null,
  user_email     text,
  subtotal       integer not null check (subtotal >= 0),
  delivery_fee   integer not null check (delivery_fee >= 0),
  total          integer not null,
  customer       jsonb not null,
  order_status   text not null default 'Pending'
                 check (order_status in ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  payment_status text not null default 'Unpaid'
                 check (payment_status in ('Unpaid', 'Paid', 'Partially refunded', 'Refunded', 'Cancelled')),
  refunded       integer not null default 0 check (refunded >= 0),
  paid_at        timestamptz,
  stock_deducted boolean not null default true,
  stock_restored boolean not null default false,
  is_demo        boolean not null default false,
  history        jsonb not null default '[]'::jsonb,
  payment_log    jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now(),
  check (total = subtotal + delivery_fee),
  check (refunded <= total)
);
create index orders_user_idx    on public.orders (user_id, created_at desc);
create index orders_created_idx on public.orders (created_at desc);
alter table public.orders enable row level security;

create table public.order_items (
  id         bigint generated always as identity primary key,
  order_id   uuid not null references public.orders (id) on delete cascade,
  slug       text not null,
  name       text not null,
  image      text,
  sku        text not null,
  size       text not null,
  colour     text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity   integer not null check (quantity between 1 and 20),
  line_total integer not null check (line_total >= 0)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_slug_idx  on public.order_items (slug);
alter table public.order_items enable row level security;

-- Customers see only their own orders. Admins see all. Nobody inserts or edits orders directly:
-- orders are created by place_order() and changed by the admin_* functions.
create policy orders_read on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or private.is_admin());
create policy order_items_read on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id));

create view public.orders_full with (security_invoker = true) as
select o.*,
       coalesce((select jsonb_agg(jsonb_build_object(
                   'slug', i.slug, 'name', i.name, 'image', i.image, 'sku', i.sku, 'size', i.size,
                   'colour', i.colour, 'unitPrice', i.unit_price, 'quantity', i.quantity,
                   'lineTotal', i.line_total) order by i.id)
                 from public.order_items i where i.order_id = o.id), '[]'::jsonb) as items
from public.orders o;

create or replace function private.order_json(p_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select to_jsonb(f) from public.orders_full f where f.id = p_id;
$$;
revoke all on function private.order_json(uuid) from public;

-- ---------------------------------------------------------------- reviews and newsletter
create table public.reviews (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null references public.products (slug) on update cascade on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  reviewer   text not null check (char_length(reviewer) between 1 and 60),
  rating     integer not null check (rating between 1 and 5),
  body       text not null check (char_length(body) between 5 and 200),
  created_at timestamptz not null default now(),
  unique (slug, user_id)
);
create index reviews_slug_idx on public.reviews (slug, created_at desc);
create index reviews_user_idx on public.reviews (user_id);
alter table public.reviews enable row level security;
create policy reviews_read on public.reviews for select to anon, authenticated using (true);
-- Only customers whose own order containing this product has been delivered can review it.
create policy reviews_insert on public.reviews for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.order_items oi join public.orders o on o.id = oi.order_id
      where o.user_id = (select auth.uid()) and o.order_status = 'Delivered' and oi.slug = reviews.slug
    )
  );

create table public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique check (email = lower(email) and char_length(email) <= 200
                                          and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
create policy newsletter_insert on public.newsletter_subscribers for insert to anon, authenticated
  with check (true);

-- ---------------------------------------------------------------- delivery rules (kobo)
-- Must match the defaults in js/checkout-config.js. The server value is the one that counts.
create or replace function private.delivery_fee(p_state text, p_subtotal integer) returns integer
language sql immutable set search_path = '' as $$
  select case
    when p_state = 'Enugu' then case when p_subtotal >= 5000000 then 0 else 200000 end
    when p_state in ('Abia', 'Anambra', 'Ebonyi', 'Imo') then 300000
    else 450000 end;
$$;
revoke all on function private.delivery_fee(text, integer) from public;

-- ---------------------------------------------------------------- place_order
-- The browser sends only SKUs and quantities. Prices, stock, delivery and totals come from the database.
-- Stock rows are locked, checked and reduced in one transaction, so two buyers can never oversell.
create or replace function public.place_order(p_items jsonb, p_customer jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid     uuid := (select auth.uid());
  v_name    text := btrim(coalesce(p_customer ->> 'fullName', ''));
  v_email   text := lower(btrim(coalesce(p_customer ->> 'email', '')));
  v_phone   text := btrim(coalesce(p_customer ->> 'phone', ''));
  v_address text := btrim(coalesce(p_customer ->> 'address', ''));
  v_city    text := btrim(coalesce(p_customer ->> 'city', ''));
  v_state   text := btrim(coalesce(p_customer ->> 'state', ''));
  v_notes   text := btrim(coalesce(p_customer ->> 'notes', ''));
  v_states  text[] := array['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];
  v_profile public.profiles%rowtype;
  v_ref     text;
  v_id      uuid;
  v_sub     integer := 0;
  v_fee     integer;
  v_lines   jsonb := '[]'::jsonb;
  v_now     timestamptz := now();
  r         record;
  v         record;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'Your cart is empty.';
  end if;
  if char_length(v_name) < 3 or char_length(v_name) > 120 then raise exception 'Enter your full name.'; end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' or char_length(v_email) > 200 then raise exception 'Enter a valid email address.'; end if;
  if regexp_replace(v_phone, '[\s-]', '', 'g') !~ '^(\+234|234|0)[789][01][0-9]{8}$' then raise exception 'Enter a valid Nigerian phone number.'; end if;
  if char_length(v_address) < 8 or char_length(v_address) > 300 then raise exception 'Enter your full delivery address.'; end if;
  if char_length(v_city) < 2 or char_length(v_city) > 100 then raise exception 'Enter your city or town.'; end if;
  if not (v_state = any (v_states)) then raise exception 'Select your state.'; end if;
  if char_length(v_notes) > 300 then raise exception 'Delivery instructions are too long.'; end if;

  if v_uid is not null then
    select * into v_profile from public.profiles where id = v_uid;
    if found and v_profile.status = 'suspended' then raise exception 'This account is suspended.'; end if;
  end if;

  v_ref := 'AUR-' || to_char(v_now at time zone 'Africa/Lagos', 'YYYYMMDD') || '-' ||
           upper(substr(md5(gen_random_uuid()::text), 1, 6));

  for r in
    select x.sku, sum(x.quantity)::integer as qty
    from jsonb_to_recordset(p_items) as x(sku text, quantity integer)
    group by x.sku order by x.sku                     -- fixed lock order avoids deadlocks
  loop
    if r.sku is null or r.qty is null or r.qty < 1 or r.qty > 20 then raise exception 'Invalid quantity.'; end if;

    select pv.id as variant_id, pv.stock, pv.size, pv.colour, pv.sku,
           p.slug, p.name, p.image, p.price
      into v
      from public.product_variants pv join public.products p on p.id = pv.product_id
     where pv.sku = r.sku and p.published
       for update of pv;
    if not found then raise exception 'An item in your cart is no longer available.'; end if;
    if v.stock < r.qty then
      raise exception 'Only % left of % (%, %). Please update your cart.', v.stock, v.name, v.colour, v.size;
    end if;

    update public.product_variants set stock = stock - r.qty where id = v.variant_id;
    insert into public.inventory_log (sku, product, change, from_qty, to_qty, reason, by_email)
    values (v.sku, v.name, -r.qty, v.stock, v.stock - r.qty, 'Order ' || v_ref, 'checkout');

    v_sub := v_sub + v.price * r.qty;
    v_lines := v_lines || jsonb_build_object('slug', v.slug, 'name', v.name, 'image', v.image, 'sku', v.sku,
                 'size', v.size, 'colour', v.colour, 'unit_price', v.price, 'quantity', r.qty,
                 'line_total', v.price * r.qty);
  end loop;

  v_fee := private.delivery_fee(v_state, v_sub);

  insert into public.orders (ref, user_id, user_email, subtotal, delivery_fee, total, customer, history)
  values (v_ref, v_uid, case when v_uid is not null then coalesce(v_profile.email, v_email) end,
          v_sub, v_fee, v_sub + v_fee,
          jsonb_build_object('fullName', v_name, 'email', v_email, 'phone', v_phone, 'address', v_address,
                             'state', v_state, 'city', v_city, 'notes', v_notes),
          jsonb_build_array(jsonb_build_object('status', 'Pending', 'at', v_now, 'note', 'Order placed')))
  returning id into v_id;

  insert into public.order_items (order_id, slug, name, image, sku, size, colour, unit_price, quantity, line_total)
  select v_id, l ->> 'slug', l ->> 'name', l ->> 'image', l ->> 'sku', l ->> 'size', l ->> 'colour',
         (l ->> 'unit_price')::integer, (l ->> 'quantity')::integer, (l ->> 'line_total')::integer
  from jsonb_array_elements(v_lines) l;

  return private.order_json(v_id);
end $$;
revoke all on function public.place_order(jsonb, jsonb) from public;
grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------- admin actions
-- Each function re-checks that the caller is an active admin. Hiding a button is not security.
create or replace function private.require_admin() returns text
language plpgsql security definer set search_path = '' as $$
declare v_email text;
begin
  if not private.is_admin() then raise exception 'Not authorised.' using errcode = '42501'; end if;
  select email into v_email from public.profiles where id = (select auth.uid());
  return v_email;
end $$;
revoke all on function private.require_admin() from public;

create or replace function public.admin_set_order_status(p_ref text, p_status text, p_note text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_by   text := private.require_admin();
  o      public.orders%rowtype;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  r      record;
  v_from integer;
begin
  select * into o from public.orders where ref = p_ref for update;
  if not found then raise exception 'Order not found.'; end if;

  if p_status = 'Cancelled' then
    if o.order_status not in ('Pending', 'Confirmed', 'Processing') then raise exception 'This order can no longer be cancelled.'; end if;
    if char_length(coalesce(v_note, '')) < 5 then raise exception 'Enter a reason of at least 5 characters.'; end if;
    if o.stock_deducted and not o.stock_restored then            -- restore stock once only
      for r in select sku, name, sum(quantity)::integer as qty from public.order_items where order_id = o.id group by sku, name order by sku loop
        update public.product_variants set stock = stock + r.qty where sku = r.sku
          returning stock - r.qty into v_from;
        if found then
          insert into public.inventory_log (sku, product, change, from_qty, to_qty, reason, by_email)
          values (r.sku, r.name, r.qty, v_from, v_from + r.qty, 'Order ' || o.ref || ' cancelled', v_by);
        end if;
      end loop;
      o.stock_restored := true;
    end if;
  else
    if not ((o.order_status = 'Pending' and p_status = 'Confirmed') or (o.order_status = 'Confirmed' and p_status = 'Processing')
         or (o.order_status = 'Processing' and p_status = 'Shipped') or (o.order_status = 'Shipped' and p_status = 'Delivered')) then
      raise exception 'That status change is not allowed.';
    end if;
    if p_status = 'Confirmed' and o.payment_status not in ('Paid', 'Partially refunded') then
      raise exception 'Verify the payment before confirming this order.';
    end if;
    v_note := coalesce(v_note, case when p_status = 'Confirmed' then 'Payment verified, order confirmed' else 'Status updated' end);
  end if;

  update public.orders
     set order_status = p_status, stock_restored = o.stock_restored,
         history = history || jsonb_build_array(jsonb_build_object('status', p_status, 'at', now(), 'note', v_note, 'by', v_by))
   where id = o.id;
  return private.order_json(o.id);
end $$;

create or replace function public.admin_verify_payment(p_ref text, p_reference text, p_reason text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_by text := private.require_admin(); o public.orders%rowtype;
begin
  if char_length(btrim(coalesce(p_reference, ''))) < 6 then raise exception 'Enter the payment reference (at least 6 characters).'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 10 then raise exception 'Enter a reason of at least 10 characters.'; end if;
  select * into o from public.orders where ref = p_ref for update;
  if not found then raise exception 'Order not found.'; end if;
  if o.payment_status <> 'Unpaid' then raise exception 'This payment is already recorded.'; end if;
  if o.order_status = 'Cancelled' then raise exception 'This order was cancelled.'; end if;
  update public.orders
     set payment_status = 'Paid', paid_at = now(),
         payment_log = payment_log || jsonb_build_array(jsonb_build_object(
           'action', 'Verified manually', 'reference', btrim(p_reference), 'reason', btrim(p_reason), 'by', v_by, 'at', now()))
   where id = o.id;
  return private.order_json(o.id);
end $$;

create or replace function public.admin_refund(p_ref text, p_amount integer, p_reason text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_by text := private.require_admin(); o public.orders%rowtype; v_left integer;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'Enter a refund amount above zero.'; end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'Enter a reason of at least 5 characters.'; end if;
  select * into o from public.orders where ref = p_ref for update;
  if not found then raise exception 'Order not found.'; end if;
  if o.payment_status not in ('Paid', 'Partially refunded') then raise exception 'Only paid orders can be refunded.'; end if;
  v_left := o.total - o.refunded;
  if p_amount > v_left then raise exception 'The most you can refund is %.', v_left; end if;
  update public.orders
     set refunded = refunded + p_amount,
         payment_status = case when refunded + p_amount >= total then 'Refunded' else 'Partially refunded' end,
         payment_log = payment_log || jsonb_build_array(jsonb_build_object(
           'action', 'Refund recorded', 'amount', p_amount, 'reason', btrim(p_reason), 'by', v_by, 'at', now()))
   where id = o.id;
  return private.order_json(o.id);
end $$;

create or replace function public.admin_adjust_stock(p_sku text, p_delta integer, p_reason text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_by text := private.require_admin(); v record; v_to integer;
begin
  if char_length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'Enter a reason of at least 5 characters.'; end if;
  select pv.id, pv.stock, p.name into v from public.product_variants pv join public.products p on p.id = pv.product_id
   where pv.sku = p_sku for update of pv;
  if not found then raise exception 'Variant not found.'; end if;
  v_to := greatest(0, v.stock + coalesce(p_delta, 0));
  update public.product_variants set stock = v_to where id = v.id;
  insert into public.inventory_log (sku, product, change, from_qty, to_qty, reason, by_email)
  values (p_sku, v.name, v_to - v.stock, v.stock, v_to, btrim(p_reason), v_by);
  return jsonb_build_object('from', v.stock, 'to', v_to);
end $$;

-- Sample orders for the dashboard screenshots. They never touch stock and are removed in one click.
create or replace function public.admin_load_demo(p_orders jsonb) returns integer
language plpgsql security definer set search_path = '' as $$
declare o jsonb; v_id uuid; n integer := 0; v_total integer; v_sub integer;
begin
  perform private.require_admin();
  if jsonb_typeof(p_orders) <> 'array' or jsonb_array_length(p_orders) > 60 then raise exception 'Invalid sample data.'; end if;
  for o in select * from jsonb_array_elements(p_orders) loop
    if left(o ->> 'ref', 9) <> 'AUR-DEMO-' then raise exception 'Sample orders must use AUR-DEMO- references.'; end if;
    v_sub := (o ->> 'subtotal')::integer; v_total := (o ->> 'total')::integer;
    insert into public.orders (ref, user_email, subtotal, delivery_fee, total, customer, order_status, payment_status,
                               paid_at, stock_deducted, is_demo, history, payment_log, created_at)
    values (o ->> 'ref', null, v_sub, v_total - v_sub, v_total, o -> 'customer', o ->> 'orderStatus', o ->> 'paymentStatus',
            nullif(o ->> 'paidAt', '')::timestamptz, false, true, coalesce(o -> 'history', '[]'), coalesce(o -> 'paymentLog', '[]'),
            (o ->> 'createdAt')::timestamptz)
    on conflict (ref) do nothing
    returning id into v_id;
    if v_id is not null then
      insert into public.order_items (order_id, slug, name, image, sku, size, colour, unit_price, quantity, line_total)
      select v_id, i ->> 'slug', i ->> 'name', i ->> 'image', i ->> 'sku', i ->> 'size', i ->> 'colour',
             (i ->> 'unitPrice')::integer, (i ->> 'quantity')::integer, (i ->> 'lineTotal')::integer
      from jsonb_array_elements(o -> 'items') i;
      n := n + 1;
    end if;
    v_id := null;
  end loop;
  return n;
end $$;

create or replace function public.admin_clear_demo() returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  perform private.require_admin();
  delete from public.orders where is_demo;
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------------------------------------------------------------- privileges
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant select on public.products, public.product_variants, public.reviews to anon, authenticated;
grant select on public.orders, public.order_items, public.orders_full, public.inventory_log to authenticated;
grant select on public.profiles to authenticated;
grant update (name, phone, addresses, status) on public.profiles to authenticated;   -- status: admins only (guard trigger)
grant insert, update, delete on public.products to authenticated;                     -- admin only (RLS)
grant insert on public.reviews to authenticated;
grant insert on public.newsletter_subscribers to anon, authenticated;

grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;
grant execute on function public.admin_set_order_status(text, text, text) to authenticated;
grant execute on function public.admin_verify_payment(text, text, text) to authenticated;
grant execute on function public.admin_refund(text, integer, text) to authenticated;
grant execute on function public.admin_adjust_stock(text, integer, text) to authenticated;
grant execute on function public.admin_load_demo(jsonb) to authenticated;
grant execute on function public.admin_clear_demo() to authenticated;
