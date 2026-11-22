"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  X,
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  CheckCircle2,
  MapPin,
  Phone,
  Package,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  categoryName: string;
  brand: string;
  description: string;
  images: string[];
  regularPrice: number;
  discountPrice?: number;
  colors: { name: string; hex: string }[];
  sizes: string[];
  stock: number;
  featured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
}

const DEMO_CATEGORIES = [
  { id: "1", name: "Jewellery & Accessories", slug: "jewellery-accessories", count: 48, image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=80" },
  { id: "2", name: "Fashion & Clothing", slug: "fashion-clothing", count: 124, image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80" },
  { id: "3", name: "Electronics & Technology", slug: "electronics-technology", count: 65, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80" },
  { id: "4", name: "Watches", slug: "watches", count: 36, image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80" },
  { id: "5", name: "Bags & Footwear", slug: "bags-footwear", count: 82, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80" },
  { id: "6", name: "Beauty & Personal Care", slug: "beauty-personal-care", count: 54, image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80" },
  { id: "7", name: "Home & Living", slug: "home-living", count: 91, image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80" },
  { id: "8", name: "Lifestyle Products", slug: "lifestyle-products", count: 43, image: "https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=900&q=80" },
];

const DEMO_PRODUCTS: Product[] = [
  {
    id: "101",
    name: "Aurelia 18K Gold Vermeil Sculpted Earrings [DEMO]",
    slug: "aurelia-gold-vermeil-earrings",
    sku: "REV-JWL-001",
    category: "jewellery-accessories",
    categoryName: "Jewellery & Accessories",
    brand: "REVASSER Atelier",
    description: "Hand-finished 18K gold vermeil statement earrings crafted for everyday luxury and evening elegance.",
    images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80"],
    regularPrice: 3450,
    discountPrice: 2890,
    colors: [{ name: "Gold Vermeil", hex: "#D4AF37" }, { name: "Sterling Silver", hex: "#C0C0C0" }],
    sizes: ["Standard"],
    stock: 18,
    featured: true,
    isNew: true,
    isBestSeller: true,
  },
  {
    id: "102",
    name: "Milano Minimalist Chronograph Watch [DEMO]",
    slug: "milano-minimalist-chronograph",
    sku: "REV-WTC-002",
    category: "watches",
    categoryName: "Watches",
    brand: "REVASSER Horology",
    description: "Sapphire-coated mineral glass with brushed stainless steel case and Italian calfskin strap.",
    images: ["https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=900&q=80"],
    regularPrice: 6800,
    discountPrice: 5450,
    colors: [{ name: "Obsidian Black", hex: "#18181B" }, { name: "Cognac Tan", hex: "#9E5B3B" }],
    sizes: ["40mm", "42mm"],
    stock: 12,
    featured: true,
    isNew: false,
    isBestSeller: true,
  },
  {
    id: "103",
    name: "Tailored Linen Blend Overshirt [DEMO]",
    slug: "tailored-linen-overshirt",
    sku: "REV-FSH-003",
    category: "fashion-clothing",
    categoryName: "Fashion & Clothing",
    brand: "REVASSER Studio",
    description: "Breathable combed cotton-linen weave tailored for the Bangladeshi climate with mother-of-pearl buttons.",
    images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80"],
    regularPrice: 2650,
    discountPrice: 2190,
    colors: [{ name: "Warm Sand", hex: "#D6C7B2" }, { name: "Charcoal", hex: "#27272A" }],
    sizes: ["S", "M", "L", "XL"],
    stock: 25,
    featured: true,
    isNew: true,
    isBestSeller: false,
  },
  {
    id: "104",
    name: "Studio ANC Wireless Headphones [DEMO]",
    slug: "studio-anc-wireless-headphones",
    sku: "REV-ELC-004",
    category: "electronics-technology",
    categoryName: "Electronics & Technology",
    brand: "REVASSER Tech",
    description: "Active noise cancellation with 40-hour battery life, multipoint Bluetooth 5.3, and memory-foam earcups.",
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80"],
    regularPrice: 5900,
    discountPrice: 4950,
    colors: [{ name: "Matte Onyx", hex: "#18181B" }, { name: "Alabaster", hex: "#E4E4E7" }],
    sizes: ["One Size"],
    stock: 9,
    featured: true,
    isNew: true,
    isBestSeller: true,
  },
];

const BD_DISTRICTS = [
  "Dhaka", "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur", "Mymensingh",
  "Cumilla", "Gazipur", "Narayanganj", "Bogura", "Cox's Bazar", "Jessore", "Dinajpur",
];

export default function StorefrontApp() {
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [categories, setCategories] = useState(DEMO_CATEGORIES);
  const [isLiveWoo, setIsLiveWoo] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");

  const [cart, setCart] = useState<{ product: Product; quantity: number; variant?: string }[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"none" | "checkout" | "track">("none");

  // Checkout state
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [district, setDistrict] = useState("Dhaka");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash" | "nagad">("cod");
  const [trxId, setTrxId] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderFailed, setOrderFailed] = useState(false);

  // Track order state
  const [trackId, setTrackId] = useState("");
  const [trackPhone, setTrackPhone] = useState("");
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackError, setTrackError] = useState("");

  useEffect(() => {
    async function loadLiveWooData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories"),
        ]);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (prodData.products?.length > 0) {
            setProducts(prodData.products);
            setIsLiveWoo(true);
          }
        }
        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.categories?.length > 0) {
            setCategories(catData.categories);
          }
        }
      } catch {
        // Fallback to DEMO catalog when WooCommerce keys are not yet configured
      }
    }
    loadLiveWooData();
  }, []);

  const deliveryFee = district === "Dhaka" ? 70 : 130;
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.product.discountPrice ?? item.product.regularPrice) * item.quantity,
    0
  );

  const filteredProducts = products
    .filter((p) => (selectedCategory === "all" ? true : p.category === selectedCategory))
    .filter((p) =>
      searchQuery.trim()
        ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    )
    .sort((a, b) => {
      const priceA = a.discountPrice ?? a.regularPrice;
      const priceB = b.discountPrice ?? b.regularPrice;
      if (sortBy === "price-asc") return priceA - priceB;
      if (sortBy === "price-desc") return priceB - priceA;
      return 0;
    });

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  }

  function toggleWishlist(id: string) {
    setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleCheckoutSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOrderSubmitting(true);
    setOrderFailed(false);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          email,
          district,
          area,
          address,
          notes,
          paymentMethod,
          trxId,
          deliveryFee,
          items: cart.map((c) => ({ id: c.product.id, quantity: c.quantity })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.orderNumber) {
        setOrderSuccess(`#${data.orderNumber}`);
        setCart([]);
      } else {
        // Only a real order number from the server counts as a placed order.
        setOrderFailed(true);
      }
    } catch {
      setOrderFailed(true);
    } finally {
      setOrderSubmitting(false);
    }
  }

  async function handleTrackSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTrackError("");
    setTrackResult(null);
    const res = await fetch(
      `/api/track-order?orderId=${encodeURIComponent(trackId)}&phone=${encodeURIComponent(trackPhone)}`
    );
    const data = await res.json();
    if (res.ok) {
      setTrackResult(data);
    } else {
      setTrackError(data.error || "Could not find order.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Announcement Bar */}
      <div className="bg-[#18181B] text-[#FAF8F5] text-xs py-2.5 px-4 text-center tracking-wide">
        Complimentary Delivery in Dhaka on Orders Over ৳2,500 &nbsp;|&nbsp; Cash on Delivery Across All 64 Districts
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedCategory("all")}
              className="font-serif text-2xl sm:text-3xl font-semibold tracking-wider text-[#18181B]"
            >
              REVASSER <span className="text-[#9E5B3B]">BD</span>
            </button>
            <span className="hidden md:inline-block text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-700">
              {isLiveWoo ? "Live Store" : "Demo Catalog"}
            </span>
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jewellery, watches, fashion, electronics..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:border-[#9E5B3B]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveModal("track")}
              className="text-xs font-medium text-stone-700 hover:text-[#9E5B3B] hidden sm:inline-flex items-center gap-1"
            >
              <Package className="w-4 h-4" /> Track Order
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-stone-800 hover:text-[#9E5B3B]"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#9E5B3B] text-white text-[10px] flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 bg-[#18181B] text-white px-4 py-2 rounded-full text-xs font-medium hover:bg-[#9E5B3B] transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Bag ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="inline-block text-xs uppercase tracking-[0.2em] text-[#9E5B3B] font-semibold bg-[#9E5B3B]/10 px-3.5 py-1.5 rounded-full">
              Everything You Love, All in One Place
            </span>
            <h1 className="font-serif text-4xl sm:text-6xl font-semibold leading-[1.08] text-[#18181B]">
              Curated Luxury &amp;{" "}
              <span className="italic text-[#9E5B3B]">Everyday</span> Essentials.
            </h1>
            <p className="text-stone-600 text-base sm:text-lg max-w-xl leading-relaxed">
              From fine jewellery and horology to modern fashion, electronics, and home living—delivered reliably across Bangladesh.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="#catalog"
                className="inline-flex items-center gap-2 bg-[#9E5B3B] text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-[#82492E] transition"
              >
                Explore Collection <ArrowRight className="w-4 h-4" />
              </a>
              <button
                onClick={() => setActiveModal("track")}
                className="inline-flex items-center gap-2 bg-white border border-stone-300 text-[#18181B] px-7 py-3.5 rounded-full text-sm font-medium hover:border-[#18181B] transition"
              >
                Track Your Order
              </button>
            </div>
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-stone-200 max-w-md">
              <div>
                <p className="font-serif text-2xl font-bold text-[#18181B]">10+</p>
                <p className="text-xs text-stone-500">Curated Categories</p>
              </div>
              <div>
                <p className="font-serif text-2xl font-bold text-[#18181B]">64</p>
                <p className="text-xs text-stone-500">Districts Covered</p>
              </div>
              <div>
                <p className="font-serif text-2xl font-bold text-[#18181B]">4.9 ★</p>
                <p className="text-xs text-stone-500">Customer Trust</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=80"
              alt="Revasser Jewellery"
              className="w-full h-80 object-cover rounded-2xl shadow-sm"
            />
            <div className="space-y-4">
              <img
                src="https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80"
                alt="Revasser Watches"
                className="w-full h-38 object-cover rounded-2xl shadow-sm"
              />
              <img
                src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80"
                alt="Revasser Fashion"
                className="w-full h-38 object-cover rounded-2xl shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-serif text-3xl font-semibold">Shop by Category</h2>
            <p className="text-sm text-stone-500 mt-1">Browse our multi-category collections</p>
          </div>
          {selectedCategory !== "all" && (
            <button
              onClick={() => setSelectedCategory("all")}
              className="text-xs font-medium text-[#9E5B3B] underline"
            >
              Show All Categories
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`group relative h-36 rounded-2xl overflow-hidden text-left p-4 flex flex-col justify-end transition ring-2 ${
                selectedCategory === cat.slug ? "ring-[#9E5B3B]" : "ring-transparent"
              }`}
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
              <div className="relative z-10 text-white">
                <p className="font-medium text-sm leading-snug">{cat.name}</p>
                <p className="text-[11px] text-stone-300">{cat.count} items</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Product Catalog */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-stone-200">
          <div>
            <h2 className="font-serif text-3xl font-semibold">
              {selectedCategory === "all"
                ? "Curated Collection"
                : categories.find((c) => c.slug === selectedCategory)?.name || "Collection"}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Showing {filteredProducts.length} products
            </p>
          </div>

          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-4 h-4 text-stone-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const activePrice = product.discountPrice ?? product.regularPrice;
            const isWishlisted = wishlist.includes(product.id);
            return (
              <div
                key={product.id}
                className="group bg-white rounded-2xl border border-stone-200/80 overflow-hidden flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-stone-700 hover:text-[#9E5B3B]"
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted ? "fill-[#9E5B3B] text-[#9E5B3B]" : ""}`} />
                    </button>
                    {product.discountPrice && (
                      <span className="absolute top-3 left-3 bg-[#9E5B3B] text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
                        Save ৳{(product.regularPrice - product.discountPrice).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-[11px] uppercase tracking-wider text-stone-400">
                      {product.categoryName}
                    </p>
                    <h3 className="font-medium text-sm text-[#18181B] mt-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="font-semibold text-base text-[#18181B]">
                        ৳{activePrice.toLocaleString()}
                      </span>
                      {product.discountPrice && (
                        <span className="text-xs text-stone-400 line-through">
                          ৳{product.regularPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4">
                  <button
                    onClick={() => addToCart(product)}
                    className="w-full py-2.5 rounded-xl bg-[#18181B] text-white text-xs font-medium hover:bg-[#9E5B3B] transition"
                  >
                    Add to Bag
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Shop With Revasser */}
      <section className="bg-white border-y border-stone-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-start gap-3.5">
            <Truck className="w-6 h-6 text-[#9E5B3B] shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">Nationwide BD Delivery</h4>
              <p className="text-xs text-stone-500 mt-1">৳70 Inside Dhaka · ৳130 All 64 Districts</p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <ShieldCheck className="w-6 h-6 text-[#9E5B3B] shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">Verified Quality</h4>
              <p className="text-xs text-stone-500 mt-1">Inspected before dispatch with Cash on Delivery</p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <RotateCcw className="w-6 h-6 text-[#9E5B3B] shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">7-Day Easy Exchange</h4>
              <p className="text-xs text-stone-500 mt-1">Hassle-free size &amp; defect replacement</p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <Headphones className="w-6 h-6 text-[#9E5B3B] shrink-0" />
            <div>
              <h4 className="font-semibold text-sm">Dedicated Support</h4>
              <p className="text-xs text-stone-500 mt-1">Direct WhatsApp &amp; phone concierge</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#18181B] text-stone-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="font-serif text-2xl text-white font-semibold tracking-wider">
              REVASSER <span className="text-[#9E5B3B]">BD</span>
            </p>
            <p className="text-xs text-stone-400 mt-2 max-w-xs leading-relaxed">
              Everything You Love, All in One Place. Official store: revasserbd.shop
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-white font-semibold mb-3">
              Customer Care
            </p>
            <ul className="space-y-2 text-xs text-stone-400">
              <li>
                <button onClick={() => setActiveModal("track")} className="hover:text-white">
                  Track Your Order
                </button>
              </li>
              <li>Cash on Delivery Policy</li>
              <li>Inside &amp; Outside Dhaka Shipping</li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-white font-semibold mb-3">
              Accepted Payments
            </p>
            <p className="text-xs text-stone-400">
              Cash on Delivery (COD) · bKash · Nagad · Bank Transfer
            </p>
          </div>
        </div>
      </footer>

      {/* Slide-over Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="w-full max-w-md bg-white h-full flex flex-col justify-between p-6 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b">
                <h3 className="font-serif text-2xl font-semibold">Shopping Bag</h3>
                <button onClick={() => setIsCartOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="text-sm text-stone-500 py-12 text-center">Your bag is currently empty.</p>
              ) : (
                <div className="divide-y">
                  {cart.map((item) => {
                    const price = item.product.discountPrice ?? item.product.regularPrice;
                    return (
                      <div key={item.product.id} className="py-4 flex gap-4">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-16 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.product.name}</p>
                          <p className="text-xs text-stone-500 mt-1">
                            ৳{price.toLocaleString()} × {item.quantity}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() =>
                                setCart((prev) =>
                                  prev
                                    .map((c) =>
                                      c.product.id === item.product.id
                                        ? { ...c, quantity: c.quantity - 1 }
                                        : c
                                    )
                                    .filter((c) => c.quantity > 0)
                                )
                              }
                              className="px-2 py-0.5 border rounded text-xs"
                            >
                              -
                            </button>
                            <span className="text-xs">{item.quantity}</span>
                            <button
                              onClick={() => addToCart(item.product)}
                              className="px-2 py-0.5 border rounded text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Subtotal</span>
                  <span>৳{subtotal.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setOrderSuccess(null);
                    setOrderFailed(false);
                    setActiveModal("checkout");
                  }}
                  className="w-full py-3.5 rounded-full bg-[#9E5B3B] text-white text-sm font-medium hover:bg-[#82492E]"
                >
                  Proceed to Bangladesh Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bangladesh Checkout Modal */}
      {activeModal === "checkout" && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal("none")}
              className="absolute top-4 right-4 text-stone-500 hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>

            {orderSuccess ? (
              <div className="text-center py-8 space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="font-serif text-3xl font-semibold">Order Placed!</h3>
                <p className="text-sm text-stone-600">
                  Thank you, <strong>{customerName}</strong>. Your order reference is{" "}
                  <span className="font-mono font-bold text-[#9E5B3B]">{orderSuccess}</span>.
                </p>
                <button
                  onClick={() => setActiveModal("none")}
                  className="px-6 py-2.5 rounded-full bg-[#18181B] text-white text-xs font-medium"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <h3 className="font-serif text-2xl font-semibold">Bangladesh Checkout</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Full Name *</label>
                    <input
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g., Tanvir Ahmed"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Mobile Number *</label>
                    <input
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">District *</label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      {BD_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Area / Thana *</label>
                    <input
                      required
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="e.g., Dhanmondi / Uttara"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Complete Delivery Address *</label>
                  <input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House, Road, Block, Flat..."
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["cod", "bkash", "nagad"] as const).map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        className={`py-2 px-3 rounded-lg border text-xs font-medium uppercase ${
                          paymentMethod === m
                            ? "border-[#9E5B3B] bg-[#9E5B3B]/10 text-[#9E5B3B]"
                            : "border-stone-200"
                        }`}
                      >
                        {m === "cod" ? "Cash on Delivery" : m}
                      </button>
                    ))}
                  </div>
                </div>

                {(paymentMethod === "bkash" || paymentMethod === "nagad") && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2 text-xs">
                    <p className="font-medium text-amber-900">
                      Manual {paymentMethod.toUpperCase()} Payment Instructions:
                    </p>
                    <p className="text-amber-800">
                      Send <strong>৳{(subtotal + deliveryFee).toLocaleString()}</strong> via Send Money to our merchant/personal number and enter your Transaction ID below for manual verification.
                    </p>
                    <input
                      required
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="Enter bKash / Nagad TrxID"
                      className="w-full border rounded px-2.5 py-1.5 bg-white"
                    />
                  </div>
                )}

                <div className="bg-stone-50 p-3 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>৳{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery ({district === "Dhaka" ? "Inside Dhaka" : "Outside Dhaka"})</span>
                    <span>৳{deliveryFee}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm pt-1 border-t">
                    <span>Total Payable</span>
                    <span>৳{(subtotal + deliveryFee).toLocaleString()}</span>
                  </div>
                </div>

                {orderFailed && (
                  <div
                    role="alert"
                    className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 space-y-1"
                  >
                    <p className="font-bold text-sm">We could not confirm your order.</p>
                    <p>
                      Please do not send any payment. If you already sent money, do not send it again and keep
                      your Transaction ID. Your bag has not been cleared.
                    </p>
                  </div>
                )}

                <button
                  disabled={orderSubmitting}
                  type="submit"
                  className="w-full py-3 rounded-full bg-[#18181B] text-white text-sm font-medium hover:bg-[#9E5B3B]"
                >
                  {orderSubmitting ? "Placing Order..." : "Confirm Order"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Track Order Modal */}
      {activeModal === "track" && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setActiveModal("none")}
              className="absolute top-4 right-4 text-stone-500 hover:text-black"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-2xl font-semibold mb-4">Track Your Order</h3>
            <form onSubmit={handleTrackSubmit} className="space-y-3">
              <input
                required
                value={trackId}
                onChange={(e) => setTrackId(e.target.value)}
                placeholder="Order ID (e.g., 1042)"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <input
                required
                value={trackPhone}
                onChange={(e) => setTrackPhone(e.target.value)}
                placeholder="Phone Number used at checkout"
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-[#18181B] text-white text-xs font-medium"
              >
                Check Status
              </button>
            </form>
            {trackError && <p className="text-xs text-red-600 mt-3">{trackError}</p>}
            {trackResult && (
              <div className="mt-4 p-3 bg-stone-50 rounded-lg text-xs space-y-1">
                <p>
                  <strong>Order #{trackResult.orderId}:</strong> {trackResult.status}
                </p>
                <p>District: {trackResult.district}</p>
                <p>Total: ৳{trackResult.total}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
