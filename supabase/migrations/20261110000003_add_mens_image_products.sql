-- Add products using the supplied, previously unused men's catalogue photos.
-- Safe to run more than once: existing products and variants are left as they are.
begin;

insert into public.products (slug, name, category, price, image, is_new, published)
values
  ('cream-wildlife-graphic-tee', 'Wildlife Graphic Tee', 'men', 2200000, '/image/men/wear12.jpg', true, true),
  ('olive-distressed-tee', 'Olive Distressed Tee', 'men', 2600000, '/image/men/wear4.jpg', true, true),
  ('essential-black-tee', 'Essential Black Tee', 'men', 1800000, '/image/men/wear9.jpg', true, true),
  ('creative-dept-graphic-tee', 'Creative Dept. Graphic Tee', 'men', 2400000, '/image/men/wear5.jpg', true, true),
  ('white-summer-shorts-set', 'White Summer Shorts Set', 'men', 3400000, '/image/men/short3.jpg', true, true),
  ('camouflage-cargo-shorts', 'Camouflage Cargo Shorts', 'men', 2800000, '/image/men/short2.jpg', true, true),
  ('black-cargo-shorts', 'Black Cargo Shorts', 'men', 2600000, '/image/men/short.jpg', true, true),
  ('lilac-panel-shorts', 'Lilac Panel Shorts', 'men', 2300000, '/image/men/wear15.jpg', true, true),
  ('striped-camp-shirt', 'Striped Camp Shirt', 'men', 2900000, '/image/men/wear10.jpg', true, true),
  ('ivory-brushstroke-tee', 'Ivory Brushstroke Tee', 'men', 2400000, '/image/men/wear13.jpg', true, true),
  ('oversized-charcoal-tee', 'Oversized Charcoal Tee', 'men', 2200000, '/image/men/wear3.jpg', true, true),
  ('light-wash-wide-leg-jeans', 'Light Wash Wide-Leg Jeans', 'men', 4200000, '/image/men/jeans2.jpg', true, true),
  ('indigo-straight-leg-jeans', 'Indigo Straight-Leg Jeans', 'men', 3900000, '/image/men/jeans3.jpg', true, true),
  ('black-cargo-denim', 'Black Cargo Denim', 'men', 4500000, '/image/men/jean5.jpg', true, true),
  ('cream-textured-co-ord', 'Cream Textured Co-ord', 'men', 5200000, '/image/men/wear7.jpg', true, true),
  ('past-present-graphic-tee', 'Past Present Graphic Tee', 'men', 2500000, '/image/men/wear11.jpg', true, true)
on conflict (slug) do nothing;

with new_catalogue (slug) as (
  values
    ('cream-wildlife-graphic-tee'),
    ('olive-distressed-tee'),
    ('essential-black-tee'),
    ('creative-dept-graphic-tee'),
    ('white-summer-shorts-set'),
    ('camouflage-cargo-shorts'),
    ('black-cargo-shorts'),
    ('lilac-panel-shorts'),
    ('striped-camp-shirt'),
    ('ivory-brushstroke-tee'),
    ('oversized-charcoal-tee'),
    ('light-wash-wide-leg-jeans'),
    ('indigo-straight-leg-jeans'),
    ('black-cargo-denim'),
    ('cream-textured-co-ord'),
    ('past-present-graphic-tee')
)
insert into public.product_variants (product_id, sku, size, colour, position, stock)
select
  p.id,
  'AUR-MEN-' || upper(replace(p.slug, '-', '')) || '-' || size_options.size || '-' || upper(colour_options.colour),
  size_options.size,
  colour_options.colour,
  (row_number() over (partition by p.id order by colour_options.colour, size_options.size) - 1)::smallint,
  10
from public.products p
join new_catalogue n on n.slug = p.slug
cross join lateral unnest(array['S', 'M', 'L', 'XL']::text[]) as size_options(size)
cross join lateral unnest(array['Black', 'Navy']::text[]) as colour_options(colour)
on conflict (product_id, size, colour) do nothing;

commit;
