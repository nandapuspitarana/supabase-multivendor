## Deliverables
- `schema.sql`: Full SQL including enums, tables, FKs, constraints, indexes, helper functions, triggers, RLS (enable + policies), and privilege revocations/grants.
- `README.md`: Setup instructions (Docker/Studio), how to apply `schema.sql`, RLS behavior by role, manual transfer verification workflow, and local JWT testing.

## Schema Details (Exact SQL to be written)
### Extensions
- `create extension if not exists pgcrypto;`

### Enums
- `create type public.user_role as enum ('customer','merchant','admin');`
- `create type public.order_status as enum ('pending_payment','paid','processing','shipped','completed','cancelled');`

### Tables
- `profiles` (1:1 to `auth.users`):
  - `id uuid primary key references auth.users(id) on delete cascade`
  - `full_name text`, `avatar_url text`
  - `role public.user_role not null default 'customer'`
  - `created_at timestamptz not null default now()`
- `shops`:
  - `id uuid primary key default gen_random_uuid()`
  - `owner_id uuid not null references public.profiles(id) on delete restrict`
  - `name text not null`, `description text`, `whatsapp_number text`, `image_url text`, `address text`
  - `is_active boolean not null default true`
  - `created_at timestamptz not null default now()`
  - Constraint: `unique(owner_id)`
- `products`:
  - `id uuid primary key default gen_random_uuid()`
  - `shop_id uuid not null references public.shops(id) on delete cascade`
  - `name text not null`
  - `price bigint not null check (price >= 0)`
  - `stock int not null default 0 check (stock >= 0)`
  - `description text`, `image_url text`, `category text`
  - `created_at timestamptz not null default now()`
- `promos`:
  - `code text primary key`
  - `discount_amount bigint not null check (discount_amount >= 0)`
  - `quota int not null default 0 check (quota >= 0)`
  - `is_active boolean not null default true`
  - `created_at timestamptz not null default now()`
- `orders`:
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null references public.profiles(id) on delete restrict`
  - `shop_id uuid not null references public.shops(id) on delete restrict`
  - `total_amount bigint not null check (total_amount >= 0)`
  - `status public.order_status not null default 'pending_payment'`
  - `payment_proof_url text`, `promo_code_used text`, `admin_notes text`
  - `created_at timestamptz not null default now()`
- `order_items`:
  - `id uuid primary key default gen_random_uuid()`
  - `order_id uuid not null references public.orders(id) on delete cascade`
  - `product_id uuid not null references public.products(id) on delete restrict`
  - `product_name text not null`
  - `quantity int not null check (quantity > 0)`
  - `price_per_item bigint not null check (price_per_item >= 0)`
  - `created_at timestamptz not null default now()`

### Indexes
- `create unique index on public.shops(owner_id);`
- `create index on public.products(shop_id);`
- `create index on public.orders(user_id);`
- `create index on public.orders(shop_id);`
- `create index on public.order_items(order_id);`
- `create index on public.promos(is_active);`

### Helper Functions
- `public.is_admin()` / `public.is_merchant()` / `public.is_customer()` using `auth.uid()` and `profiles.role`, marked `stable` and `security definer` (schema-qualified, `search_path` set to `public`).

### Trigger for Profiles
- Function `public.handle_new_user()` (security definer) to insert into `public.profiles`:
  - `full_name` := `coalesce(new.raw_user_meta_data->>'full_name', coalesce(new.email,''))`
  - `avatar_url` := `coalesce(new.raw_user_meta_data->>'avatar_url','')`
  - `role` := `'customer'`
- Trigger `create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();`

### RLS Enablement
- `alter table public.profiles enable row level security;`
- `alter table public.shops enable row level security;`
- `alter table public.products enable row level security;`
- `alter table public.promos enable row level security;`
- `alter table public.orders enable row level security;`
- `alter table public.order_items enable row level security;`
- Optionally: `alter table ... force row level security;`

### Policies (exact forms)
- `profiles`:
  - Select own: `create policy profiles_select_own on public.profiles for select using (id = auth.uid());`
  - Admin all: `create policy profiles_admin_all on public.profiles for all using (public.is_admin()) with check (public.is_admin());`
- `shops`:
  - Public read: `create policy shops_public_read on public.shops for select using (true);`
  - Insert self-owned: `create policy shops_insert_self on public.shops for insert with check ((public.is_merchant() or public.is_admin()) and owner_id = auth.uid());`
  - Update self-owned: `create policy shops_update_self on public.shops for update using ((public.is_merchant() or public.is_admin()) and owner_id = auth.uid()) with check ((public.is_merchant() or public.is_admin()) and owner_id = auth.uid());`
  - Admin delete: `create policy shops_admin_delete on public.shops for delete using (public.is_admin());`
- `products`:
  - Public read: `create policy products_public_read on public.products for select using (true);`
  - Insert by shop owner: `create policy products_insert_owner on public.products for insert with check ((public.is_merchant() or public.is_admin()) and exists(select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));`
  - Update/Delete by owner or admin with same `exists` predicate in `using` and `check`.
- `promos`:
  - Public read: `create policy promos_public_read on public.promos for select using (true);`
  - Admin write: `create policy promos_admin_write on public.promos for all using (public.is_admin()) with check (public.is_admin());`
- `orders`:
  - Customer read own: `create policy orders_customer_read on public.orders for select using (user_id = auth.uid());`
  - Merchant read incoming: `create policy orders_merchant_read on public.orders for select using (exists(select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));`
  - Admin read: `create policy orders_admin_read on public.orders for select using (public.is_admin());`
  - Insert customer (and admin optional): `create policy orders_customer_insert on public.orders for insert with check (user_id = auth.uid() or public.is_admin());`
  - Update/Delete admin: `create policy orders_admin_write on public.orders for all using (public.is_admin()) with check (public.is_admin());`
- `order_items`:
  - Customer read own: `create policy order_items_customer_read on public.order_items for select using (exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));`
  - Merchant read incoming: `create policy order_items_merchant_read on public.order_items for select using (exists(select 1 from public.orders o join public.shops s on s.id = o.shop_id where o.id = order_id and s.owner_id = auth.uid()));`
  - Admin read: `create policy order_items_admin_read on public.order_items for select using (public.is_admin());`
  - Insert customer tied to own order: `create policy order_items_customer_insert on public.order_items for insert with check (exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));`
  - Update/Delete admin: `create policy order_items_admin_write on public.order_items for all using (public.is_admin()) with check (public.is_admin());`

### Privileges
- Revoke default and rely on RLS:
  - `revoke all on all tables in schema public from public;`
  - Grant minimal usage:
    - `grant usage on schema public to authenticated, anon;`
    - `grant select on all sequences in schema public to authenticated, anon;`

## README Outline
- Architecture summary and roles.
- Applying `schema.sql` via Studio or Docker (`psql`) with Windows notes.
- Role elevation: update `profiles.role` to `merchant`/`admin`.
- RLS behavior examples per role.
- Manual bank transfer flow and how Admin updates status.
- Optional: create storage bucket `payment-proofs` and suggested storage policies.
- Local RLS testing with JWT claims:
  - `set role authenticated;`
  - `select set_config('request.jwt.claims', '{"sub":"<UUID>"}', true);`
  - `select auth.uid();`

## Implementation Steps
1. Write `schema.sql` with the exact SQL above.
2. Add `README.md` with setup and workflow details.
3. (Optional) Seed minimal sample data for testing.
4. Validate by applying schema and checking policies via JWT claims.

If you approve, I will generate `schema.sql` and `README.md` in the repository and can apply them to your running Supabase instance if desired.