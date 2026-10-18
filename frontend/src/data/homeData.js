// src/data/homeData.js
// All text, prices and product data for the Home page.
// PRICES, RATINGS, REVIEWS, STOCK, SPECS AND DETAILS BELOW ARE SAMPLE VALUES: replace with your real ones.
// off = discount percent. rating: null hides the stars.
// image: null -> the emoji shows.
// images: [a, b, c] -> optional extra photos for the product page gallery (see the note at the bottom).

import headphones from "../assets/headphones.png";
import smartWatch from "../assets/Smartwatch.png"
import earBuds from "../assets/Earbuds.png"
import bluetoothSpeaker from "../assets/bluetoothSpeaker.png"
import powerBank from "../assets/powerBank.png"
import mouse from "../assets/mouse.png"
import keyboard from "../assets/keyboard.png"
import mobileCharger from "../assets/mobileCharger.png"
import chargingCable from "../assets/chargingCable.png"
import usb from "../assets/usb.png"
import OTG from "../assets/OTG.png"
import auxCable from "../assets/auxCable.png"
import temperedGlass from "../assets/temperedGlass.png"
import usbDongle from "../assets/usbDongle.png"
import mobileRepair from "../assets/mobileRepair.png"
import laptopRepair from "../assets/laptopRepair.png"
import tabletRepair from "../assets/tabletRepair.png"
import smartWatchRepair from "../assets/smartWatchRepair.png"
import ledTVRepair from "../assets/ledTVRepair.png"
import extensionBoard from "../assets/extensionBoard.png"
import internetCables from "../assets/internetCables.png"
import phoneAccessories from "../assets/phoneAccessories.png"
import ledBulbs from "../assets/ledBulbs.png"
import torch from "../assets/torch.png"

// ---------- shared product-page fields (every product gets these) ----------
const common = {
  unit: "1 unit",
  delivery: "Same day",
  brand: "Synara",
  replacement: "7 days only replacement",
};

// sample offer row: only shown for products priced ₹300 or more
const offerFor = (price) =>
  price >= 300
    ? { text: `Buy at ₹${(price - 50).toLocaleString("en-IN")}`, code: "SYNARA50", more: 2 }
    : undefined;

export const slides = [
  {
    id: 1,
    kicker: "YOUR ELECTRONICS PARTNER",
    title: "Gadgets & Accessories,\nBest Prices",
    subtitle: "Earbuds, chargers, power banks & more",
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
    title: "Up to 50% OFF\nTop Accessories",
    subtitle: "Limited time deals on everyday electronics",
    cta: "View Deals",
    link: "/categories",
  },
];

export const popular = [
  {
    ...common, id: "p1", name: "Smart Watch", price: 1799, mrp: 2999, off: 40, rating: 4.1, reviews: 530, emoji: "⌚", image: smartWatch,
    stock: 5, offer: offerFor(1799), warranty: "1 Year Warranty",
    specs: [{ label: "Display", value: "1.8 inch" }, { label: "Strap", value: "Silicone" }, { label: "Colour", value: "Black" }],
    description: "Smart watch with a bright display and fitness tracking for everyday use.",
    highlights: ["Bright 1.8 inch display", "Heart rate and step tracking", "Bluetooth calling"],
  },
  {
    ...common, id: "p2", name: "Headphones", price: 799, mrp: 1299, off: 38, rating: 4.3, reviews: 920, emoji: "🎧", image: headphones,
    stock: 3, offer: offerFor(799), warranty: "1 Year Warranty",
    specs: [{ label: "Type", value: "Over-ear" }, { label: "Connectivity", value: "Bluetooth" }, { label: "Colour", value: "Black" }],
    description: "Over-ear wireless headphones with a comfortable fit.",
    highlights: ["Bluetooth wireless", "Soft ear cushions", "Long battery life"],
  },
  {
    ...common, id: "p3", name: "Ear Buds", price: 999, mrp: 1599, off: 38, rating: 4.4, reviews: 1280, emoji: "🎧", image: earBuds,
    stock: 8, offer: offerFor(999), warranty: "1 Year Warranty",
    specs: [{ label: "Type", value: "In-ear (TWS)" }, { label: "Connectivity", value: "Bluetooth" }, { label: "Colour", value: "Black" }],
    description: "True wireless earbuds with a compact charging case.",
    highlights: ["Touch controls", "Clear calls with built-in mic", "Charging case included"],
  },
  {
    ...common, id: "p4", name: "Speaker", price: 999, mrp: 1499, off: 33, rating: 4.5, reviews: 970, emoji: "🔊", image: bluetoothSpeaker,
    stock: 4, offer: offerFor(999), warranty: "1 Year Warranty",
    specs: [{ label: "Type", value: "Portable" }, { label: "Connectivity", value: "Bluetooth" }, { label: "Colour", value: "Black" }],
    description: "Portable Bluetooth speaker with deep bass and a rugged fabric finish.",
    highlights: ["Powerful bass", "Splash resistant", "Rechargeable battery"],
  },
  {
    ...common, id: "p5", name: "Power Bank", price: 1099, mrp: 1599, off: 31, rating: 4.4, reviews: 760, emoji: "🔋", image: powerBank,
    stock: 6, offer: offerFor(1099), warranty: "1 Year Warranty",
    specs: [{ label: "Capacity", value: "10000 mAh" }, { label: "Ports", value: "3" }, { label: "Colour", value: "Black" }],
    description: "Slim power bank that charges up to three devices at once.",
    highlights: ["Fast charging", "Charges 3 devices together", "Slim and pocket friendly"],
  },
  {
    ...common, id: "p6", name: "Mouse", price: 349, mrp: 499, off: 30, rating: 4.2, reviews: 350, emoji: "🖱️", image: mouse,
    stock: 10, offer: offerFor(349), warranty: "6 Months Warranty",
    specs: [{ label: "Type", value: "Wireless" }, { label: "Connectivity", value: "2.4 GHz" }, { label: "Colour", value: "Black" }],
    description: "Wireless mouse with a comfortable shape and smooth tracking.",
    highlights: ["Plug and play USB receiver", "Smooth and quiet clicks", "Battery powered"],
  },
  {
    ...common, id: "p7", name: "Keyboard", price: 599, mrp: 899, off: 33, rating: 4.0, reviews: 280, emoji: "⌨️", image: keyboard,
    stock: 7, offer: offerFor(599), warranty: "6 Months Warranty",
    specs: [{ label: "Type", value: "Wireless" }, { label: "Layout", value: "Full size" }, { label: "Colour", value: "Black" }],
    description: "Full-size wireless keyboard with a number pad for work and home.",
    highlights: ["Full size with number pad", "Quiet typing", "Plug and play USB receiver"],
  },
  {
    ...common, id: "p8", name: "LED Bulb", price: 99, mrp: 149, off: 34, rating: 4.6, reviews: 1850, emoji: "💡", image: ledBulbs,
    stock: 20, offer: offerFor(99),
    specs: [{ label: "Wattage", value: "9 W" }, { label: "Base", value: "B22" }, { label: "Light", value: "Cool white" }],
    description: "Energy saving LED bulb that gives bright, even light.",
    highlights: ["Low power use", "Bright cool white light", "Long life"],
  },
];

export const accessories = [
  {
    ...common, id: "a1", name: "Charger", price: 499, mrp: 799, off: 38, rating: 4.3, reviews: 720, emoji: "🔌", image: mobileCharger,
    stock: 9, offer: offerFor(499), warranty: "6 Months Warranty",
    specs: [{ label: "Power", value: "33 W" }, { label: "Ports", value: "2" }, { label: "Colour", value: "Black" }],
    description: "Fast wall charger with two ports and a cable in the box.",
    highlights: ["33 W fast charging", "Two output ports", "Cable included"],
  },
  {
    ...common, id: "a2", name: "Charging Cable", price: 199, mrp: 349, off: 43, rating: 4.4, reviews: 880, emoji: "🔗", image: chargingCable,
    stock: 15, offer: offerFor(199),
    specs: [{ label: "Type", value: "Type-C to Type-C" }, { label: "Length", value: "1.5 m" }, { label: "Colour", value: "Black" }],
    description: "Strong braided cable for fast charging and data transfer.",
    highlights: ["Fast charging support", "Tangle free", "Strong and durable"],
  },
  {
    ...common, id: "a3", name: "Pendrive", price: 449, mrp: 699, off: 36, rating: 4.2, reviews: 410, emoji: "💾", image: usb,
    stock: 12, offer: offerFor(449),
    specs: [{ label: "Capacity", value: "64 GB" }, { label: "Interface", value: "USB 3.0" }, { label: "Colour", value: "Black" }],
    description: "Compact pendrive for fast file transfer.",
    highlights: ["Fast USB 3.0 speed", "Compact and light", "Plug and play"],
  },
  {
    ...common, id: "a4", name: "OTG", price: 99, mrp: 199, off: 50, rating: 4.1, reviews: 640, emoji: "🔄", image: OTG,
    stock: 25, offer: offerFor(99),
    specs: [{ label: "Type", value: "USB to Type-C" }, { label: "Use", value: "Phone and tablet" }],
    description: "OTG adapter to connect pendrives and other USB devices to your phone.",
    highlights: ["Works with phones and tablets", "Compact size", "Plug and play"],
  },
  {
    ...common, id: "a5", name: "AUX Cable", price: 149, mrp: 249, off: 40, rating: 4.3, reviews: 390, emoji: "🔗", image: auxCable,
    stock: 18, offer: offerFor(149),
    specs: [{ label: "Connector", value: "3.5 mm" }, { label: "Length", value: "1.5 m" }, { label: "Colour", value: "Black" }],
    description: "3.5 mm AUX cable for speakers, car stereos and headphones.",
    highlights: ["Gold plated connectors", "Clear sound", "Tangle free"],
  },
  {
    ...common, id: "a6", name: "Glass Guard", price: 149, mrp: 299, off: 50, rating: 4.1, reviews: 2100, emoji: "🛡️", image: temperedGlass,
    stock: 30, offer: offerFor(149),
    specs: [{ label: "Type", value: "Tempered glass" }, { label: "Hardness", value: "9H" }, { label: "Finish", value: "Clear" }],
    description: "Tempered glass screen guard that protects against scratches and drops.",
    highlights: ["9H hardness", "Bubble free fitting", "Clear and smooth touch"],
  },
  {
    ...common, id: "a7", name: "USB Dongle", price: 249, mrp: 399, off: 38, rating: 4.0, reviews: 210, emoji: "📡", image: usbDongle,
    stock: 11, offer: offerFor(249),
    specs: [{ label: "Interface", value: "USB" }, { label: "Use", value: "Plug and play" }],
    description: "USB dongle for adding wireless connectivity to your computer.",
    highlights: ["Plug and play", "Compact size", "Works with laptops and desktops"],
  },
  {
    ...common, id: "a8", name: "Phone Accessories", price: 199, mrp: 349, off: 43, rating: 4.2, reviews: 560, emoji: "📱", image: phoneAccessories,
    stock: 14, offer: offerFor(199),
    specs: [{ label: "Type", value: "Assorted" }, { label: "Use", value: "Mobile phones" }],
    description: "Useful everyday accessories for your mobile phone.",
    highlights: ["Everyday essentials", "Fits most phones", "Good quality"],
  },
  {
    ...common, id: "a9", name: "Internet Wire", price: 199, mrp: 299, off: 33, rating: 4.3, reviews: 300, emoji: "🌐", image: internetCables,
    stock: 16, offer: offerFor(199),
    specs: [{ label: "Type", value: "LAN cable" }, { label: "Length", value: "10 m" }],
    description: "LAN cable for stable wired internet at home or office.",
    highlights: ["Stable wired connection", "Strong and flexible", "Ready to use"],
  },
  {
    ...common, id: "a10", name: "Extension Board", price: 399, mrp: 599, off: 33, rating: 4.5, reviews: 680, emoji: "🔌", image: extensionBoard,
    stock: 6, offer: offerFor(399), warranty: "6 Months Warranty",
    specs: [{ label: "Sockets", value: "4" }, { label: "Length", value: "3 m" }, { label: "Colour", value: "White" }],
    description: "Extension board with individual switches and a long cord.",
    highlights: ["4 sockets with switches", "3 m long cord", "Overload protection"],
  },
  {
    ...common, id: "a11", name: "Torch", price: 249, mrp: 399, off: 38, rating: 4.4, reviews: 450, emoji: "🔦", image: torch,
    stock: 9, offer: offerFor(249),
    specs: [{ label: "Type", value: "LED" }, { label: "Power", value: "Rechargeable" }, { label: "Colour", value: "Black" }],
    description: "Bright rechargeable LED torch for home and travel.",
    highlights: ["Bright LED light", "USB rechargeable", "Easy to carry"],
  },
];

export const repairs = [
  { id: "mobile-repair", name: "Mobile Phone Repair", tags: ["Screen", "Battery", "Charging port"], price: 499, emoji: "📱", image: mobileRepair },
  { id: "laptop-repair", name: "Laptop Repair", tags: ["Screen", "Keyboard", "Software"], price: 799, emoji: "💻", image: laptopRepair },
  { id: "tablet-repair", name: "Tablet Repair", tags: ["Screen", "Battery"], price: 699, emoji: "📲", image: tabletRepair },
  { id: "watch-repair", name: "Smartwatch Repair", tags: ["Screen", "Battery"], price: 399, emoji: "⌚", image: smartWatchRepair },
  { id: "tv-repair", name: "TV Repair", tags: ["Panel", "Power", "Sound"], price: 599, emoji: "📺", image: ledTVRepair },
];

export const deals = [
  { id: "d1", variant: "dark", lead: "Up to", title: "50% OFF", sub: "Top Accessories", cta: "Shop Now", image: null },
  { id: "d2", variant: "yellow", title: "Accessories\nUnder ₹499", sub: "Cables, chargers & more", cta: "Explore", image: null },
  { id: "d3", variant: "dark", lead: "Flat", title: "₹200 OFF", sub: "On your first repair", cta: "Book Now", image: null },
  { id: "d4", variant: "yellow", title: "Free Pickup\n& Delivery", sub: "On all repairs", cta: "Learn More", image: null },
];

export const categoryGroups = [
  {
    id: "audio",
    title: "Audio & Wearables",
    items: [
      { id: "headphones", name: "Headphones", emoji: "🎧", image: headphones },
      { id: "ear-buds", name: "Ear Buds", emoji: "🎧", image: earBuds },
      { id: "speakers", name: "Speakers", emoji: "🔊", image: bluetoothSpeaker },
      { id: "smart-watches", name: "Smart Watches", emoji: "⌚", image: smartWatch },
    ],
  },
  {
    id: "power",
    title: "Power & Cables",
    items: [
      { id: "chargers", name: "Chargers", emoji: "🔌", image: mobileCharger },
      { id: "charging-cables", name: "Charging Cables", emoji: "🔗", image: chargingCable },
      { id: "power-banks", name: "Power Banks", emoji: "🔋", image: powerBank },
      { id: "aux-otg", name: "AUX & OTG", emoji: "🔄", image: auxCable },
      { id: "extension-boards", name: "Extension Boards", emoji: "🔌", image: extensionBoard },
      { id: "internet-wire", name: "Internet Wire", emoji: "🌐", image: internetCables },
    ],
  },
  {
    id: "computer",
    title: "Computer Accessories",
    items: [
      { id: "mouse", name: "Mouse", emoji: "🖱️", image: mouse },
      { id: "keyboard", name: "Keyboard", emoji: "⌨️", image: keyboard },
      { id: "pendrives", name: "Pendrives", emoji: "💾", image: usb },
      { id: "usb-dongles", name: "USB Dongles", emoji: "📡", image: usbDongle },
    ],
  },
  {
    id: "more",
    title: "More Products",
    items: [
      { id: "glass-guard", name: "Glass Guard", emoji: "🛡️", image: temperedGlass },
      { id: "phone-accessories", name: "Phone Accessories", emoji: "📱", image: phoneAccessories },
      { id: "led-bulbs", name: "LED Bulbs", emoji: "💡", image: ledBulbs },
      { id: "torch", name: "Torch", emoji: "🔦", image: torch },
    ],
  },
  {
    id: "repairs",
    title: "Repair Services",
    items: [
      { id: "mobile-repair", name: "Mobile Repair", emoji: "🔧", image: mobileRepair },
      { id: "laptop-repair", name: "Laptop Repair", emoji: "🛠️", image: laptopRepair },
      { id: "tablet-repair", name: "Tablet Repair", emoji: "📲", image: tabletRepair },
      { id: "tv-repair", name: "TV Repair", emoji: "📺", image: ledTVRepair },
    ],
  },
];