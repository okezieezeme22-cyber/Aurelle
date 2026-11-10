-- Add unique local-image products across all storefront categories.
-- Safe to run more than once: existing products and variants are left as they are.
begin;

insert into public.products (slug, name, category, price, image, is_new, published)
values
  ('beige-ribbed-knit-top', 'Beige Ribbed Knit Top', 'women', 1850000, '/image/Women/beige-ribbed-top.jpg', true, true),
  ('black-tailored-blazer', 'Black Tailored Blazer', 'women', 4800000, '/image/Women/black-tailored-blazer.jpg', true, true),
  ('classic-cream-blazer', 'Classic Cream Blazer', 'women', 4500000, '/image/Women/classic-cream-blazer.jpg', true, true),
  ('ivory-button-shirt', 'Ivory Button Shirt', 'women', 2100000, '/image/Women/ivory-button-shirt.jpg', true, true),
  ('taupe-tailored-trousers', 'Taupe Tailored Trousers', 'women', 2900000, '/image/Women/taupe-tailored-trousers.jpg', true, true),
  ('olive-utility-overshirt', 'Olive Utility Overshirt', 'men', 3200000, '/image/men/olive-utility-overshirt.jpg', true, true),
  ('charcoal-polo-shirt', 'Charcoal Polo Shirt', 'men', 2400000, '/image/men/charcoal-polo-shirt.jpg', true, true),
  ('white-button-shirt', 'White Button Shirt', 'men', 2000000, '/image/men/white-button-shirt.jpg', true, true),
  ('black-crossbody-bag', 'Black Crossbody Bag', 'bags', 3400000, '/image/bags/black-crossbody-bag.jpg', true, true),
  ('cognac-structured-tote', 'Cognac Structured Tote', 'bags', 5200000, '/image/bags/cognac-structured-tote.jpg', true, true),
  ('cream-shoulder-bag', 'Cream Shoulder Bag', 'bags', 3800000, '/image/bags/cream-shoulder-bag.jpg', true, true),
  ('cognac-leather-sandals', 'Cognac Leather Sandals', 'footwear', 2600000, '/image/footwear/cognac-leather-sandals.jpg', true, true),
  ('tan-suede-loafers', 'Tan Suede Loafers', 'footwear', 4900000, '/image/footwear/tan-suede-loafers.jpg', true, true),
  ('white-minimal-sneakers', 'White Minimal Sneakers', 'footwear', 3900000, '/image/footwear/white-minimal-sneakers.jpg', true, true),
  ('black-frame-sunglasses', 'Black Frame Sunglasses', 'accessories', 1200000, '/image/accessories/black-frame-sunglasses.jpg', true, true),
  ('gold-tone-watch', 'Gold Tone Watch', 'accessories', 2800000, '/image/accessories/gold-tone-watch.jpg', true, true)
on conflict (slug) do nothing;

with new_catalogue (slug, category) as (
  values
    ('beige-ribbed-knit-top', 'women'),
    ('black-tailored-blazer', 'women'),
    ('classic-cream-blazer', 'women'),
    ('ivory-button-shirt', 'women'),
    ('taupe-tailored-trousers', 'women'),
    ('olive-utility-overshirt', 'men'),
    ('charcoal-polo-shirt', 'men'),
    ('white-button-shirt', 'men'),
    ('black-crossbody-bag', 'bags'),
    ('cognac-structured-tote', 'bags'),
    ('cream-shoulder-bag', 'bags'),
    ('cognac-leather-sandals', 'footwear'),
    ('tan-suede-loafers', 'footwear'),
    ('white-minimal-sneakers', 'footwear'),
    ('black-frame-sunglasses', 'accessories'),
    ('gold-tone-watch', 'accessories')
)
insert into public.product_variants (product_id, sku, size, colour, position, stock)
select
  p.id,
  'AUR-' || upper(p.slug) || '-' || upper(replace(size_options.size, ' ', '')) || '-' || upper(replace(colour_options.colour, ' ', '')),
  size_options.size,
  colour_options.colour,
  (row_number() over (partition by p.id order by colour_options.colour, size_options.size) - 1)::smallint,
  10
from public.products p
join new_catalogue n on n.slug = p.slug
cross join lateral unnest(
  case n.category
    when 'women' then array['S', 'M', 'L', 'XL']::text[]
    when 'men' then array['S', 'M', 'L', 'XL']::text[]
    when 'footwear' then array['39', '40', '41', '42', '43', '44']::text[]
    else array['One size']::text[]
  end
) as size_options(size)
cross join lateral unnest(
  case
    when n.slug = 'black-frame-sunglasses' then array['Black', 'Tortoise']::text[]
    when n.slug = 'gold-tone-watch' then array['Gold', 'Silver']::text[]
    when n.category = 'women' then array['Black', 'Cream']::text[]
    when n.category = 'men' then array['Black', 'Navy']::text[]
    when n.category = 'bags' then array['Black', 'Tan']::text[]
    when n.category = 'footwear' then array['White', 'Black']::text[]
    else array['Black', 'Tan']::text[]
  end
) as colour_options(colour)
on conflict (product_id, size, colour) do nothing;

commit;
