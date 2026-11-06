/* AURÉLLE demo catalogue — fictional products and prices.
   Prices are stored in kobo (₦1 = 100 kobo), as a payment provider expects.
   Later steps read this same file for the shop and product pages. */
const U = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

window.AURELLE_PRODUCTS = [
  { slug: 'linen-wrap-dress',      name: 'Linen Wrap Dress',        category: 'women',       price: 3200000, compare: 4000000, image: U('1515886657613-9f3515b0c78f'), bestseller: true,  isNew: false, stock: 14, sold: 96 },
  { slug: 'classic-oversized-blazer', name: 'Classic Oversized Blazer', category: 'women',    price: 4500000, compare: null,    image: U('1434389677669-e08b4cac3105'), bestseller: true,  isNew: true,  stock: 22, sold: 120 },
  { slug: 'ribbed-knit-set',       name: 'Ribbed Knit Set',         category: 'women',       price: 2400000, compare: null,    image: U('1490481651871-ab68de25d43d'), bestseller: false, isNew: true,  stock: 9,  sold: 41 },
  { slug: 'pleated-midi-skirt',    name: 'Pleated Midi Skirt',      category: 'women',       price: 1800000, compare: 2300000, image: U('1483985988355-763728e1935b'), bestseller: false, isNew: false, stock: 3,  sold: 58 },
  { slug: 'tailored-wool-trousers', name: 'Tailored Wool Trousers', category: 'men',         price: 3400000, compare: null,    image: U('1507679799987-c73779587ccf'), bestseller: true,  isNew: false, stock: 18, sold: 88 },
  { slug: 'overshirt-jacket',      name: 'Cotton Overshirt Jacket', category: 'men',         price: 2800000, compare: null,    image: U('1617137968427-85924c800a22'), bestseller: false, isNew: true,  stock: 12, sold: 33 },
  { slug: 'knit-polo',             name: 'Merino Knit Polo',        category: 'men',         price: 2000000, compare: 2600000, image: U('1469334031218-e382a71b716b'), bestseller: false, isNew: false, stock: 25, sold: 47 },
  { slug: 'structured-tote',       name: 'Structured Leather Tote', category: 'bags',        price: 5500000, compare: null,    image: U('1584917865442-de89df76afd3'), bestseller: true,  isNew: false, stock: 7,  sold: 74 },
  { slug: 'mini-crossbody',        name: 'Mini Crossbody Bag',      category: 'bags',        price: 2800000, compare: null,    image: U('1548036328-c9fa89d128fa'), bestseller: false, isNew: true,  stock: 16, sold: 52 },
  { slug: 'weekend-backpack',      name: 'Weekend Backpack',        category: 'bags',        price: 2200000, compare: 2800000, image: U('1553062407-98eeb64c6a62'), bestseller: false, isNew: false, stock: 20, sold: 29 },
  { slug: 'leather-low-sneaker',   name: 'Leather Low Sneaker',     category: 'footwear',    price: 3800000, compare: null,    image: U('1549298916-b41d501d3772'), bestseller: true,  isNew: false, stock: 30, sold: 110 },
  { slug: 'suede-loafer',          name: 'Suede Loafer',            category: 'footwear',    price: 6500000, compare: null,    image: U('1542291026-7eec264c27ff'), bestseller: false, isNew: true,  stock: 8,  sold: 36 },
  { slug: 'everyday-trainer',      name: 'Everyday Trainer',        category: 'footwear',    price: 2500000, compare: 3200000, image: U('1491553895911-0055eca6402d'), bestseller: false, isNew: false, stock: 0,  sold: 64 },
  { slug: 'steel-link-watch',      name: 'Steel Link Watch',        category: 'accessories', price: 2500000, compare: null,    image: U('1523275335684-37898b6baf30'), bestseller: false, isNew: true,  stock: 11, sold: 27 },
  { slug: 'acetate-sunglasses',    name: 'Acetate Sunglasses',      category: 'accessories', price: 800000,  compare: null,    image: U('1572635196237-14b3f281503f'), bestseller: false, isNew: false, stock: 40, sold: 61 }
];

window.AURELLE_CATEGORIES = [
  { key: 'women',       label: "Women's Fashion", image: U('1515886657613-9f3515b0c78f') },
  { key: 'men',         label: "Men's Fashion",   image: U('1507679799987-c73779587ccf') },
  { key: 'bags',        label: 'Bags',            image: U('1584917865442-de89df76afd3') },
  { key: 'footwear',    label: 'Footwear',        image: U('1549298916-b41d501d3772') },
  { key: 'accessories', label: 'Accessories',     image: U('1523275335684-37898b6baf30') }
];

/* Added in step 3: created dates (for "newest") */
window.AURELLE_PRODUCTS.forEach((p, i) => {
  p.created = new Date(Date.UTC(2026, 9, 30 - (p.isNew ? i : i + 40))).toISOString().slice(0, 10);
});
