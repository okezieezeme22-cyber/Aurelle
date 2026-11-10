-- Add products using supplied, previously unused women's catalogue photos.
-- Safe to run more than once: existing products and variants are left as they are.
begin;

insert into public.products (slug, name, category, price, image, is_new, published)
values
  ('blue-hooded-denim-jacket', 'Blue Hooded Denim Jacket', 'women', 4900000, '/image/Women/wear2%20(3).jpg', true, true),
  ('light-wash-cropped-denim-jacket', 'Light-Wash Cropped Denim Jacket', 'women', 4600000, '/image/Women/wear2%20(5).jpg', true, true),
  ('light-wash-denim-shorts', 'Light-Wash Denim Shorts', 'women', 2600000, '/image/Women/wear1%20(4).jpg', true, true),
  ('plum-wide-leg-jeans', 'Plum Wide-Leg Jeans', 'women', 3900000, '/image/Women/wear1%20(5).jpg', true, true),
  ('dark-denim-flare-jeans', 'Dark Denim Flare Jeans', 'women', 4200000, '/image/Women/wear1%20(13).jpg', true, true),
  ('red-sport-polo-and-jeans', 'Red Sport Polo & Jeans', 'women', 3400000, '/image/Women/wear3.jpg', true, true),
  ('vintage-graphic-tee', 'Vintage Graphic Tee', 'women', 2400000, '/image/Women/wear1%20(6).jpg', true, true),
  ('american-dream-oversized-tee', 'American Dream Oversized Tee', 'women', 2600000, '/image/Women/wear1%20(9).jpg', true, true),
  ('relaxed-black-lounge-set', 'Relaxed Black Lounge Set', 'women', 3800000, '/image/Women/wear1%20(3).jpg', true, true),
  ('green-sport-jersey', 'Green Sport Jersey', 'women', 2800000, '/image/Women/wear1%20(10).jpg', true, true),
  ('green-sport-crop-top', 'Green Sport Crop Top', 'women', 2200000, '/image/Women/wear1%20(7).jpg', true, true),
  ('cream-off-shoulder-maxi-dress', 'Cream Off-Shoulder Maxi Dress', 'women', 4600000, '/image/Women/wear2%20(6).jpg', true, true),
  ('plum-halter-midi-dress', 'Plum Halter Midi Dress', 'women', 4200000, '/image/Women/wear2%20(7).jpg', true, true),
  ('black-ribbed-lounge-set', 'Black Ribbed Lounge Set', 'women', 3600000, '/image/Women/wear1%20(1).jpg', true, true),
  ('sky-blue-knit-co-ord', 'Sky Blue Knit Co-ord', 'women', 3900000, '/image/Women/wear1%20(12).jpg', true, true)
on conflict (slug) do nothing;

with new_catalogue (slug) as (
  values
    ('blue-hooded-denim-jacket'),
    ('light-wash-cropped-denim-jacket'),
    ('light-wash-denim-shorts'),
    ('plum-wide-leg-jeans'),
    ('dark-denim-flare-jeans'),
    ('red-sport-polo-and-jeans'),
    ('vintage-graphic-tee'),
    ('american-dream-oversized-tee'),
    ('relaxed-black-lounge-set'),
    ('green-sport-jersey'),
    ('green-sport-crop-top'),
    ('cream-off-shoulder-maxi-dress'),
    ('plum-halter-midi-dress'),
    ('black-ribbed-lounge-set'),
    ('sky-blue-knit-co-ord')
)
insert into public.product_variants (product_id, sku, size, colour, position, stock)
select
  p.id,
  'AUR-WOM-' || upper(replace(p.slug, '-', '')) || '-' || size_options.size || '-' || upper(colour_options.colour),
  size_options.size,
  colour_options.colour,
  (row_number() over (partition by p.id order by colour_options.colour, size_options.size) - 1)::smallint,
  10
from public.products p
join new_catalogue n on n.slug = p.slug
cross join lateral unnest(array['S', 'M', 'L', 'XL']::text[]) as size_options(size)
cross join lateral unnest(array['Black', 'Cream']::text[]) as colour_options(colour)
on conflict (product_id, size, colour) do nothing;

commit;
