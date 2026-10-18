// src/data/homeData.js
// All text, prices and product data for the Home page.
// image: null -> the component shows the emoji instead. Set image later when you have real photos.

export const slides = [
  {
    id: 1,
    kicker: "YOUR ELECTRONICS PARTNER",
    title: "Latest Gadgets,\nBest Prices",
    subtitle: "Phones, laptops & accessories delivered fast",
    cta: "Shop Now",
    link: "/categories",
  },
  {
    id: 2,
    kicker: "EXPERT REPAIRS",
    title: "Fast Repairs\nAt Your Doorstep",
    subtitle: "Get your device fixed in no time",
    cta: "Book Repair",
    link: "/repairs",
  },
  {
    id: 3,
    kicker: "FESTIVE OFFERS",
    title: "Up to 50% OFF\nTop Brands",
    subtitle: "Limited time deals on mobiles & accessories",
    cta: "View Deals",
    link: "/categories",
  },
];

export const popular = [
  { id: "p1", name: "boAt Airdopes Wireless Earbuds", price: 1299, mrp: 1599, off: 19, rating: 4.4, reviews: 1280, emoji: "🎧", image: null },
  { id: "p2", name: "Redmi 13C 5G Smartphone", price: 10999, mrp: 13999, off: 21, rating: 4.3, reviews: 860, emoji: "📱", image: null },
  { id: "p3", name: "Lenovo IdeaPad Laptop", price: 32990, mrp: 42990, off: 23, rating: 4.2, reviews: 410, emoji: "💻", image: null },
  { id: "p4", name: "Smart Watch Fitness Band", price: 1799, mrp: 2999, off: 40, rating: 4.1, reviews: 530, emoji: "⌚", image: null },
  { id: "p5", name: "Bluetooth Speaker Portable", price: 999, mrp: 1499, off: 33, rating: 4.5, reviews: 970, emoji: "🔊", image: null },
  { id: "p6", name: "Tablet 10 inch 4GB 64GB", price: 8999, mrp: 11999, off: 25, rating: 4.0, reviews: 220, emoji: "📲", image: null },
  { id: "p7", name: "Wireless Neckband Earphones", price: 699, mrp: 1199, off: 42, rating: 4.2, reviews: 1500, emoji: "🎧", image: null },
  { id: "p8", name: "Power Bank 10000mAh", price: 1099, mrp: 1599, off: 31, rating: 4.4, reviews: 760, emoji: "🔋", image: null },
];

export const accessories = [
  { id: "a1", name: "Mobile Phone Case", price: 299, mrp: 399, off: 25, rating: 4.3, reviews: 640, emoji: "📱", image: null },
  { id: "a2", name: "Type-C Fast Charging Cable", price: 399, mrp: 469, off: 15, rating: 4.4, reviews: 880, emoji: "🔌", image: null },
  { id: "a3", name: "Wireless Mouse", price: 899, mrp: 999, off: 10, rating: 4.2, reviews: 350, emoji: "🖱️", image: null },
  { id: "a4", name: "Tempered Glass Screen Guard", price: 149, mrp: 299, off: 50, rating: 4.1, reviews: 2100, emoji: "🛡️", image: null },
  { id: "a5", name: "20W Fast Charger Adapter", price: 499, mrp: 799, off: 38, rating: 4.3, reviews: 720, emoji: "🔌", image: null },
  { id: "a6", name: "USB Flash Drive 64GB", price: 449, mrp: 699, off: 36, rating: 4.2, reviews: 410, emoji: "💾", image: null },
  { id: "a7", name: "Laptop Sleeve Bag", price: 599, mrp: 999, off: 40, rating: 4.0, reviews: 180, emoji: "💼", image: null },
  { id: "a8", name: "Phone Stand Holder", price: 199, mrp: 349, off: 43, rating: 4.1, reviews: 560, emoji: "📱", image: null },
];

export const repairs = [
  { id: "mobile-repair", name: "Mobile Phone Repair", tags: ["Screen", "Battery", "Charging port"], price: 499, emoji: "📱", image: null },
  { id: "laptop-repair", name: "Laptop Repair", tags: ["Screen", "Keyboard", "Software"], price: 799, emoji: "💻", image: null },
  { id: "tablet-repair", name: "Tablet Repair", tags: ["Screen", "Battery"], price: 699, emoji: "📲", image: null },
  { id: "watch-repair", name: "Smartwatch Repair", tags: ["Screen", "Battery"], price: 399, emoji: "⌚", image: null },
  { id: "tv-repair", name: "TV Repair", tags: ["Panel", "Power", "Sound"], price: 599, emoji: "📺", image: null },
];

export const deals = [
  { id: "d1", variant: "dark", lead: "Up to", title: "50% OFF", sub: "Top Mobile Brands", cta: "Shop Now", image: null },
  { id: "d2", variant: "yellow", title: "Accessories\nUnder ₹499", sub: "Cases, cables & more", cta: "Explore", image: null },
  { id: "d3", variant: "dark", lead: "Flat", title: "₹200 OFF", sub: "On your first repair", cta: "Book Now", image: null },
  { id: "d4", variant: "yellow", title: "Free Pickup\n& Delivery", sub: "On all repairs", cta: "Learn More", image: null },
];

export const categoryGroups = [
  {
    id: "devices",
    title: "Mobiles & Laptops",
    items: [
      { id: "smartphones", name: "Smartphones", emoji: "📱", image: null },
      { id: "laptops", name: "Laptops & Computers", emoji: "💻", image: null },
      { id: "tablets", name: "Tablets", emoji: "📲", image: null },
      { id: "smartwatches", name: "Smart Watches", emoji: "⌚", image: null },
    ],
  },
  {
    id: "accessories",
    title: "Accessories",
    items: [
      { id: "chargers", name: "Chargers & Cables", emoji: "🔌", image: null },
      { id: "cases", name: "Cases & Covers", emoji: "📱", image: null },
      { id: "audio", name: "Earphones & Speakers", emoji: "🎧", image: null },
      { id: "powerbanks", name: "Power Banks", emoji: "🔋", image: null },
    ],
  },
  {
    id: "repairs",
    title: "Repair Services",
    items: [
      { id: "mobile-repair", name: "Mobile Repair", emoji: "🔧", image: null },
      { id: "laptop-repair", name: "Laptop Repair", emoji: "🛠️", image: null },
      { id: "tablet-repair", name: "Tablet Repair", emoji: "📲", image: null },
      { id: "tv-repair", name: "TV Repair", emoji: "📺", image: null },
    ],
  },
];