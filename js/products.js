/* AURÉLLE demo catalogue — fictional products and prices.
   Prices are stored in kobo (₦1 = 100 kobo), as a payment provider expects.
   Later steps read this same file for the shop and product pages. */
const L = (path) => `/${path}`;

window.AURELLE_PRODUCTS = [
  { slug: 'denim-utility-co-ord', name: 'Denim Utility Co-ord', category: 'women', price: 4200000, compare: null, image: L('image/Women/02-06-26_S3_PM_67_B325DJ3809_TanMulti_ZSR_JG_DR_18-57-24_PLUS_7838_PXF.jpg'), bestseller: false, isNew: true, featured: true, stock: 12, sold: 0 },
  { slug: 'sport-polo-denim-look', name: 'Sport Polo & Denim Look', category: 'women', price: 2850000, compare: null, image: L('image/Women/wear2%20(2).jpg'), bestseller: false, isNew: true, featured: true, stock: 16, sold: 0 },
  { slug: 'born-different-graphic-tee', name: 'Born Different Graphic Tee', category: 'men', price: 2200000, compare: null, image: L('image/men/wear.jpg'), bestseller: false, isNew: true, featured: true, stock: 20, sold: 0 },
  { slug: 'colorblock-knit-polo', name: 'Colorblock Knit Polo', category: 'men', price: 3200000, compare: null, image: L('image/men/wear2.jpg'), bestseller: false, isNew: true, featured: true, stock: 14, sold: 0 },
  { slug: 'beige-ribbed-knit-top', name: 'Beige Ribbed Knit Top', category: 'women', price: 1850000, compare: null, image: L('image/Women/beige-ribbed-top.jpg'), bestseller: false, isNew: true, homepage: true, stock: 12, sold: 0 },
  { slug: 'black-tailored-blazer', name: 'Black Tailored Blazer', category: 'women', price: 4800000, compare: null, image: L('image/Women/black-tailored-blazer.jpg'), bestseller: false, isNew: true, homepage: true, stock: 10, sold: 0 },
  { slug: 'classic-cream-blazer', name: 'Classic Cream Blazer', category: 'women', price: 4500000, compare: null, image: L('image/Women/classic-cream-blazer.jpg'), bestseller: false, isNew: true, homepage: true, stock: 10, sold: 0 },
  { slug: 'ivory-button-shirt', name: 'Ivory Button Shirt', category: 'women', price: 2100000, compare: null, image: L('image/Women/ivory-button-shirt.jpg'), bestseller: false, isNew: true, homepage: true, stock: 18, sold: 0 },
  { slug: 'taupe-tailored-trousers', name: 'Taupe Tailored Trousers', category: 'women', price: 2900000, compare: null, image: L('image/Women/taupe-tailored-trousers.jpg'), bestseller: false, isNew: true, homepage: true, stock: 14, sold: 0 },
  { slug: 'olive-utility-overshirt', name: 'Olive Utility Overshirt', category: 'men', price: 3200000, compare: null, image: L('image/men/olive-utility-overshirt.jpg'), bestseller: false, isNew: true, homepage: true, stock: 12, sold: 0 },
  { slug: 'charcoal-polo-shirt', name: 'Charcoal Polo Shirt', category: 'men', price: 2400000, compare: null, image: L('image/men/charcoal-polo-shirt.jpg'), bestseller: false, isNew: true, homepage: true, stock: 16, sold: 0 },
  { slug: 'white-button-shirt', name: 'White Button Shirt', category: 'men', price: 2000000, compare: null, image: L('image/men/white-button-shirt.jpg'), bestseller: false, isNew: true, homepage: true, stock: 18, sold: 0 },
  { slug: 'black-crossbody-bag', name: 'Black Crossbody Bag', category: 'bags', price: 3400000, compare: null, image: L('image/bags/black-crossbody-bag.jpg'), bestseller: false, isNew: true, homepage: true, stock: 9, sold: 0 },
  { slug: 'cognac-structured-tote', name: 'Cognac Structured Tote', category: 'bags', price: 5200000, compare: null, image: L('image/bags/cognac-structured-tote.jpg'), bestseller: false, isNew: true, homepage: true, stock: 8, sold: 0 },
  { slug: 'cream-shoulder-bag', name: 'Cream Shoulder Bag', category: 'bags', price: 3800000, compare: null, image: L('image/bags/cream-shoulder-bag.jpg'), bestseller: false, isNew: true, homepage: true, stock: 10, sold: 0 },
  { slug: 'cognac-leather-sandals', name: 'Cognac Leather Sandals', category: 'footwear', price: 2600000, compare: null, image: L('image/footwear/cognac-leather-sandals.jpg'), bestseller: false, isNew: true, homepage: true, stock: 12, sold: 0 },
  { slug: 'tan-suede-loafers', name: 'Tan Suede Loafers', category: 'footwear', price: 4900000, compare: null, image: L('image/footwear/tan-suede-loafers.jpg'), bestseller: false, isNew: true, homepage: true, stock: 10, sold: 0 },
  { slug: 'white-minimal-sneakers', name: 'White Minimal Sneakers', category: 'footwear', price: 3900000, compare: null, image: L('image/footwear/white-minimal-sneakers.jpg'), bestseller: false, isNew: true, homepage: true, stock: 14, sold: 0 },
  { slug: 'black-frame-sunglasses', name: 'Black Frame Sunglasses', category: 'accessories', price: 1200000, compare: null, image: L('image/accessories/black-frame-sunglasses.jpg'), bestseller: false, isNew: true, homepage: true, stock: 18, sold: 0 },
  { slug: 'gold-tone-watch', name: 'Gold Tone Watch', category: 'accessories', price: 2800000, compare: null, image: L('image/accessories/gold-tone-watch.jpg'), bestseller: false, isNew: true, homepage: true, stock: 10, sold: 0 },
  { slug: 'cream-wildlife-graphic-tee', name: 'Wildlife Graphic Tee', category: 'men', price: 2200000, compare: null, image: L('image/men/wear12.jpg'), bestseller: false, isNew: true, homepage: true, stock: 14, sold: 0 },
  { slug: 'olive-distressed-tee', name: 'Olive Distressed Tee', category: 'men', price: 2600000, compare: null, image: L('image/men/wear4.jpg'), bestseller: false, isNew: true, homepage: true, stock: 12, sold: 0 },
  { slug: 'essential-black-tee', name: 'Essential Black Tee', category: 'men', price: 1800000, compare: null, image: L('image/men/wear9.jpg'), bestseller: false, isNew: true, homepage: true, stock: 20, sold: 0 },
  { slug: 'creative-dept-graphic-tee', name: 'Creative Dept. Graphic Tee', category: 'men', price: 2400000, compare: null, image: L('image/men/wear5.jpg'), bestseller: false, isNew: true, homepage: true, stock: 15, sold: 0 },
  { slug: 'white-summer-shorts-set', name: 'White Summer Shorts Set', category: 'men', price: 3400000, compare: null, image: L('image/men/short3.jpg'), bestseller: false, isNew: true, homepage: true, stock: 10, sold: 0 },
  { slug: 'camouflage-cargo-shorts', name: 'Camouflage Cargo Shorts', category: 'men', price: 2800000, compare: null, image: L('image/men/short2.jpg'), bestseller: false, isNew: true, homepage: true, stock: 12, sold: 0 },
  { slug: 'black-cargo-shorts', name: 'Black Cargo Shorts', category: 'men', price: 2600000, compare: null, image: L('image/men/short.jpg'), bestseller: false, isNew: true, homepage: true, stock: 14, sold: 0 },
  { slug: 'lilac-panel-shorts', name: 'Lilac Panel Shorts', category: 'men', price: 2300000, compare: null, image: L('image/men/wear15.jpg'), bestseller: false, isNew: true, homepage: true, stock: 10, sold: 0 },
  { slug: 'striped-camp-shirt', name: 'Striped Camp Shirt', category: 'men', price: 2900000, compare: null, image: L('image/men/wear10.jpg'), bestseller: false, isNew: true, homepage: true, stock: 14, sold: 0 },
  { slug: 'ivory-brushstroke-tee', name: 'Ivory Brushstroke Tee', category: 'men', price: 2400000, compare: null, image: L('image/men/wear13.jpg'), bestseller: false, isNew: true, homepage: true, stock: 12, sold: 0 },
  { slug: 'oversized-charcoal-tee', name: 'Oversized Charcoal Tee', category: 'men', price: 2200000, compare: null, image: L('image/men/wear3.jpg'), bestseller: false, isNew: true, homepage: true, stock: 16, sold: 0 },
  { slug: 'light-wash-wide-leg-jeans', name: 'Light Wash Wide-Leg Jeans', category: 'men', price: 4200000, compare: null, image: L('image/men/jeans2.jpg'), bestseller: false, isNew: true, homepage: true, stock: 10, sold: 0 },
  { slug: 'indigo-straight-leg-jeans', name: 'Indigo Straight-Leg Jeans', category: 'men', price: 3900000, compare: null, image: L('image/men/jeans3.jpg'), bestseller: false, isNew: true, homepage: true, stock: 12, sold: 0 },
  { slug: 'black-cargo-denim', name: 'Black Cargo Denim', category: 'men', price: 4500000, compare: null, image: L('image/men/jean5.jpg'), bestseller: false, isNew: true, homepage: true, stock: 9, sold: 0 },
  { slug: 'cream-textured-co-ord', name: 'Cream Textured Co-ord', category: 'men', price: 5200000, compare: null, image: L('image/men/wear7.jpg'), bestseller: false, isNew: true, homepage: true, stock: 8, sold: 0 },
  { slug: 'past-present-graphic-tee', name: 'Past Present Graphic Tee', category: 'men', price: 2500000, compare: null, image: L('image/men/wear11.jpg'), bestseller: false, isNew: true, homepage: true, stock: 12, sold: 0 },
  { slug: 'blue-hooded-denim-jacket', name: 'Blue Hooded Denim Jacket', category: 'women', price: 4900000, compare: null, image: L('image/Women/wear2%20(3).jpg'), bestseller: false, isNew: true, homepage: true, stock: 10, sold: 0 },
  { slug: 'light-wash-cropped-denim-jacket', name: 'Light-Wash Cropped Denim Jacket', category: 'women', price: 4600000, compare: null, image: L('image/Women/wear2%20(5).jpg'), bestseller: false, isNew: true, homepage: true, stock: 9, sold: 0 },
  { slug: 'light-wash-denim-shorts', name: 'Light-Wash Denim Shorts', category: 'women', price: 2600000, compare: null, image: L('image/Women/wear1%20(4).jpg'), bestseller: false, isNew: true, homepage: true, stock: 12, sold: 0 },
  { slug: 'plum-wide-leg-jeans', name: 'Plum Wide-Leg Jeans', category: 'women', price: 3900000, compare: null, image: L('image/Women/wear1%20(5).jpg'), bestseller: false, isNew: true, homepage: true, stock: 10, sold: 0 },
  { slug: 'dark-denim-flare-jeans', name: 'Dark Denim Flare Jeans', category: 'women', price: 4200000, compare: null, image: L('image/Women/wear1%20(13).jpg'), bestseller: false, isNew: true, homepage: true, stock: 10, sold: 0 },
  { slug: 'red-sport-polo-and-jeans', name: 'Red Sport Polo & Jeans', category: 'women', price: 3400000, compare: null, image: L('image/Women/wear3.jpg'), bestseller: false, isNew: true, homepage: true, stock: 12, sold: 0 },
  { slug: 'vintage-graphic-tee', name: 'Vintage Graphic Tee', category: 'women', price: 2400000, compare: null, image: L('image/Women/wear1%20(6).jpg'), bestseller: false, isNew: true, homepage: true, stock: 12, sold: 0 },
  { slug: 'american-dream-oversized-tee', name: 'American Dream Oversized Tee', category: 'women', price: 2600000, compare: null, image: L('image/Women/wear1%20(9).jpg'), bestseller: false, isNew: true, homepage: true, stock: 12, sold: 0 },
  { slug: 'relaxed-black-lounge-set', name: 'Relaxed Black Lounge Set', category: 'women', price: 3800000, compare: null, image: L('image/Women/wear1%20(3).jpg'), bestseller: false, isNew: true, homepage: true, stock: 8, sold: 0 },
  { slug: 'green-sport-jersey', name: 'Green Sport Jersey', category: 'women', price: 2800000, compare: null, image: L('image/Women/wear1%20(10).jpg'), bestseller: false, isNew: true, homepage: true, stock: 12, sold: 0 },
  { slug: 'green-sport-crop-top', name: 'Green Sport Crop Top', category: 'women', price: 2200000, compare: null, image: L('image/Women/wear1%20(7).jpg'), bestseller: false, isNew: true, homepage: true, stock: 14, sold: 0 },
  { slug: 'cream-off-shoulder-maxi-dress', name: 'Cream Off-Shoulder Maxi Dress', category: 'women', price: 4600000, compare: null, image: L('image/Women/wear2%20(6).jpg'), bestseller: false, isNew: true, homepage: true, stock: 8, sold: 0 },
  { slug: 'plum-halter-midi-dress', name: 'Plum Halter Midi Dress', category: 'women', price: 4200000, compare: null, image: L('image/Women/wear2%20(7).jpg'), bestseller: false, isNew: true, homepage: true, stock: 8, sold: 0 },
  { slug: 'black-ribbed-lounge-set', name: 'Black Ribbed Lounge Set', category: 'women', price: 3600000, compare: null, image: L('image/Women/wear1%20(1).jpg'), bestseller: false, isNew: true, homepage: true, stock: 9, sold: 0 },
  { slug: 'sky-blue-knit-co-ord', name: 'Sky Blue Knit Co-ord', category: 'women', price: 3900000, compare: null, image: L('image/Women/wear1%20(12).jpg'), bestseller: false, isNew: true, homepage: true, stock: 9, sold: 0 },
  { slug: 'linen-wrap-dress',      name: 'Linen Wrap Dress',        category: 'women',       price: 3200000, compare: 4000000, image: L('image/Women/02-06-26_S3_PM_67_B325DJ3809_TanMulti_ZSR_JG_DR_18-57-24_PLUS_7838_PXF.jpg'), bestseller: true,  isNew: false, stock: 14, sold: 96 },
  { slug: 'classic-oversized-blazer', name: 'Classic Oversized Blazer', category: 'women',    price: 4500000, compare: null,    image: L('image/Women/wear1%20(2).jpg'), bestseller: true,  isNew: true,  stock: 22, sold: 120 },
  { slug: 'ribbed-knit-set',       name: 'Ribbed Knit Set',         category: 'women',       price: 2400000, compare: null,    image: L('image/Women/wear1%20(8).jpg'), bestseller: false, isNew: true,  stock: 9,  sold: 41 },
  { slug: 'pleated-midi-skirt',    name: 'Pleated Midi Skirt',      category: 'women',       price: 1800000, compare: 2300000, image: L('image/Women/wear2%20(1).jpg'), bestseller: false, isNew: false, stock: 3,  sold: 58 },
  { slug: 'tailored-wool-trousers', name: 'Tailored Wool Trousers', category: 'men',         price: 3400000, compare: null,    image: L('image/men/jeans.jpg'), bestseller: true,  isNew: false, stock: 18, sold: 88 },
  { slug: 'overshirt-jacket',      name: 'Cotton Overshirt Jacket', category: 'men',         price: 2800000, compare: null,    image: L('image/men/wear.jpg'), bestseller: false, isNew: true,  stock: 12, sold: 33 },
  { slug: 'knit-polo',             name: 'Merino Knit Polo',        category: 'men',         price: 2000000, compare: 2600000, image: L('image/men/06-10-26_S5_91_B526MKT1213_Green_ZSR_LR_AM_15-26-00_3647_MWA.jpg'), bestseller: false, isNew: false, stock: 25, sold: 47 },
  { slug: 'structured-tote',       name: 'Structured Leather Tote', category: 'bags',        price: 5500000, compare: null,    image: L('image/homepage/red-leather-bag.jpg'), bestseller: true,  isNew: false, stock: 7,  sold: 74 },
  { slug: 'mini-crossbody',        name: 'Mini Crossbody Bag',      category: 'bags',        price: 2800000, compare: null,    image: L('image/Women/wear2%20(4).jpg'), bestseller: false, isNew: true,  stock: 16, sold: 52 },
  { slug: 'weekend-backpack',      name: 'Weekend Backpack',        category: 'bags',        price: 2200000, compare: 2800000, image: L('image/Women/wear1%20(11).jpg'), bestseller: false, isNew: false, stock: 20, sold: 29 },
  { slug: 'leather-low-sneaker',   name: 'Leather Low Sneaker',     category: 'footwear',    price: 3800000, compare: null,    image: L('image/men/wear6.jpg'), bestseller: true,  isNew: false, stock: 30, sold: 110 },
  { slug: 'suede-loafer',          name: 'Suede Loafer',            category: 'footwear',    price: 6500000, compare: null,    image: L('image/men/wear8.jpg'), bestseller: false, isNew: true,  stock: 8,  sold: 36 },
  { slug: 'everyday-trainer',      name: 'Everyday Trainer',        category: 'footwear',    price: 2500000, compare: 3200000, image: L('image/men/jeans4.jpg'), bestseller: false, isNew: false, stock: 0,  sold: 64 },
  { slug: 'steel-link-watch',      name: 'Steel Link Watch',        category: 'accessories', price: 2500000, compare: null,    image: L('image/bags/photo-1523275335684-37898b6baf30.jpg'), bestseller: false, isNew: true,  stock: 11, sold: 27 },
  { slug: 'acetate-sunglasses',    name: 'Acetate Sunglasses',      category: 'accessories', price: 800000,  compare: null,    image: L('image/men/wear14.jpg'), bestseller: false, isNew: false, stock: 40, sold: 61 }
];

window.AURELLE_CATEGORIES = [
  { key: 'women',       label: "Women's Fashion", image: L('image/Women/02-06-26_S3_PM_67_B325DJ3809_TanMulti_ZSR_JG_DR_18-57-24_PLUS_7838_PXF.jpg') },
  { key: 'men',         label: "Men's Fashion",   image: L('image/men/06-10-26_S5_91_B526MKT1213_Green_ZSR_LR_AM_15-26-00_3647_MWA.jpg') },
  { key: 'bags',        label: 'Bags',            image: L('image/homepage/red-leather-bag.jpg') },
  { key: 'footwear',    label: 'Footwear',        image: L('image/footwear/photo-1542291026-7eec264c27ff.jpg') },
  { key: 'accessories', label: 'Accessories',     image: L('image/men/wear14.jpg') }
];

/* Added in step 3: created dates (for "newest") */
window.AURELLE_PRODUCTS.forEach((p, i) => {
  p.created = new Date(Date.UTC(2026, 9, 30 - (p.isNew ? i : i + 40))).toISOString().slice(0, 10);
});
window.AURELLE_LOCAL_PRODUCTS = window.AURELLE_PRODUCTS;
