"use client";

import React, { useState } from "react";
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
  Star,
  Gift,
} from "lucide-react";
import type { Content, Product } from "@/lib/content";

const ICONS = {
  Truck, Shield: ShieldCheck, Return: RotateCcw, Headphones, Phone, Location: MapPin,
  Package, Heart, Check: CheckCircle2, Star, Gift,
};

export default function StorefrontApp({ content }: { content: Content }) {
  const { header, banner, headings, benefits, footer, checkout, blocks, sections, products, categories } = content;
  const payments = (["cod", "bkash", "nagad"] as const).filter((m) => checkout[m]);

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
  const [district, setDistrict] = useState(checkout.districts[0] || "");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash" | "nagad">(payments[0] || "cod");
  const [trxId, setTrxId] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderFailed, setOrderFailed] = useState(false);

  // Track order state
  const [trackId, setTrackId] = useState("");
  const [trackPhone, setTrackPhone] = useState("");
  const [trackResult, setTrackResult] = useState<any>(null);
  const [trackError, setTrackError] = useState("");

  const deliveryFee = district === checkout.insideDistrict ? checkout.insideFee : checkout.outsideFee;
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

  const sectionViews: Record<string, React.ReactNode> = {
    Banner: (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="inline-block text-xs uppercase tracking-[0.2em] text-accent font-semibold bg-accent/10 px-3.5 py-1.5 rounded-full">
              {banner.tagline}
            </span>
            <h1 className="font-serif text-4xl sm:text-6xl font-semibold leading-[1.08] text-ink">
              {banner.titleStart}{" "}
              <span className="italic text-accent">{banner.titleHighlight}</span>{" "}
              {banner.titleEnd}
            </h1>
            <p className="text-stone-600 text-base sm:text-lg max-w-xl leading-relaxed">
              {banner.text}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={banner.primaryLink}
                className="inline-flex items-center gap-2 bg-accent text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-accent-hover transition"
              >
                {banner.primaryButton} <ArrowRight className="w-4 h-4" />
              </a>
              {banner.secondButton && (
              <button
                onClick={() => setActiveModal("track")}
                className="inline-flex items-center gap-2 bg-white border border-stone-300 text-ink px-7 py-3.5 rounded-full text-sm font-medium hover:border-ink transition"
              >
                {banner.secondButton}
              </button>
              )}
            </div>
            {banner.stats.length > 0 && (
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-stone-200 max-w-md">
                {banner.stats.map((stat, i) => (
                  <div key={i}>
                    <p className="font-serif text-2xl font-bold text-ink">{stat.value}</p>
                    <p className="text-xs text-stone-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            {banner.photos.slice(0, 1).map((photo, i) => (
              <img key={i} src={photo.src} alt={photo.description} className="w-full h-80 object-cover rounded-2xl shadow-sm" />
            ))}
            <div className="space-y-4">
              {banner.photos.slice(1).map((photo, i) => (
                <img key={i} src={photo.src} alt={photo.description} className="w-full h-38 object-cover rounded-2xl shadow-sm" />
              ))}
            </div>
          </div>
        </div>
      </section>
    ),
    Categories: (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-serif text-3xl font-semibold">{headings.categoriesTitle}</h2>
            <p className="text-sm text-stone-500 mt-1">{headings.categoriesText}</p>
          </div>
          {selectedCategory !== "all" && (
            <button
              onClick={() => setSelectedCategory("all")}
              className="text-xs font-medium text-accent underline"
            >
              {headings.showAll}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`group relative h-36 rounded-2xl overflow-hidden text-left p-4 flex flex-col justify-end transition ring-2 ${
                selectedCategory === cat.slug ? "ring-accent" : "ring-transparent"
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
                {cat.countLabel && <p className="text-[11px] text-stone-300">{cat.countLabel}</p>}
              </div>
            </button>
          ))}
        </div>
      </section>
    ),
    Products: (
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-stone-200">
          <div>
            <h2 className="font-serif text-3xl font-semibold">
              {selectedCategory === "all"
                ? headings.productsTitle
                : categories.find((c) => c.slug === selectedCategory)?.name || "Collection"}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              {headings.showingWord} {filteredProducts.length} {headings.productsWord}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-4 h-4 text-stone-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none"
            >
              <option value="featured">{headings.sortFeatured}</option>
              <option value="price-asc">{headings.sortLow}</option>
              <option value="price-desc">{headings.sortHigh}</option>
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
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-stone-700 hover:text-accent"
                    >
                      <Heart className={`w-4 h-4 ${isWishlisted ? "fill-accent text-accent" : ""}`} />
                    </button>
                    {product.discountPrice && (
                      <span className="absolute top-3 left-3 bg-accent text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
                        {headings.saveWord} ৳{(product.regularPrice - product.discountPrice).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="text-[11px] uppercase tracking-wider text-stone-400">
                      {product.categoryName}
                    </p>
                    <h3 className="font-medium text-sm text-ink mt-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="font-semibold text-base text-ink">
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
                    className="w-full py-2.5 rounded-xl bg-ink text-white text-xs font-medium hover:bg-accent transition"
                  >
                    {headings.addButton}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    ),
    "Extra blocks": (
      <>
        {blocks.blocks.map((block, i) => (
          <section key={i} className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className={`grid gap-8 items-center ${block.src ? "md:grid-cols-2" : ""}`}>
              {block.src && <img src={block.src} alt={block.title} className="w-full rounded-2xl object-cover" />}
              <div className="space-y-3">
                <h2 className="font-serif text-3xl font-semibold">{block.title}</h2>
                <p className="text-stone-600 whitespace-pre-line leading-relaxed">{block.text}</p>
                {block.button && block.link && (
                  <a href={block.link} className="inline-block bg-accent text-white px-7 py-3.5 rounded-full text-sm font-medium hover:bg-accent-hover">
                    {block.button}
                  </a>
                )}
              </div>
            </div>
          </section>
        ))}
      </>
    ),
    Benefits: (
      <section className="bg-white border-y border-stone-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.items.map((item, i) => {
            const Icon = ICONS[item.icon as keyof typeof ICONS] || CheckCircle2;
            return (
              <div key={i} className="flex items-start gap-3.5">
                <Icon className="w-6 h-6 text-accent shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">{item.title}</h4>
                  <p className="text-xs text-stone-500 mt-1">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    ),
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Announcement Bar */}
      {header.announcements.length > 0 && (
        <div className="bg-ink text-page text-xs py-2.5 px-4 text-center tracking-wide">
          {header.announcements.join(" \u00a0|\u00a0 ")}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-page/95 backdrop-blur border-b border-stone-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedCategory("all")}
              className="font-serif text-2xl sm:text-3xl font-semibold tracking-wider text-ink"
            >
              {header.logoImage ? (
                <img src={header.logoImage} alt={`${header.logoMain} ${header.logoAccent}`} className="max-h-12 max-w-[200px] object-contain" />
              ) : (
                <>{header.logoMain} <span className="text-accent">{header.logoAccent}</span></>
              )}
            </button>
            {header.badge && (
              <span className="hidden md:inline-block text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-700">
                {header.badge}
              </span>
            )}
          </div>

          {/* Search */}
          <div className="hidden md:flex items-center flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={header.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:border-accent"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {header.showTrack && (
              <button
                onClick={() => setActiveModal("track")}
                className="text-xs font-medium text-stone-700 hover:text-accent hidden sm:inline-flex items-center gap-1"
              >
                <Package className="w-4 h-4" /> {header.trackLabel}
              </button>
            )}

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-stone-800 hover:text-accent"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-white text-[10px] flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 bg-ink text-white px-4 py-2 rounded-full text-xs font-medium hover:bg-accent transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{header.bagLabel} ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            </button>
          </div>
        </div>
      </header>

      {sections.map((name) => (
        <React.Fragment key={name}>{sectionViews[name]}</React.Fragment>
      ))}

      {/* Footer */}
      <footer className="bg-ink text-stone-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="font-serif text-2xl text-white font-semibold tracking-wider">
              {header.logoMain} <span className="text-accent">{header.logoAccent}</span>
            </p>
            <p className="text-xs text-stone-400 mt-2 max-w-xs leading-relaxed">
              {footer.about}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-white font-semibold mb-3">
              {footer.careTitle}
            </p>
            <ul className="space-y-2 text-xs text-stone-400">
              {footer.trackLink && (
                <li>
                  <button onClick={() => setActiveModal("track")} className="hover:text-white">
                    {footer.trackLink}
                  </button>
                </li>
              )}
              {footer.careLines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-white font-semibold mb-3">
              {footer.paymentsTitle}
            </p>
            <p className="text-xs text-stone-400">
              {footer.paymentsText}
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
                <h3 className="font-serif text-2xl font-semibold">{checkout.bagTitle}</h3>
                <button onClick={() => setIsCartOpen(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cart.length === 0 ? (
                <p className="text-sm text-stone-500 py-12 text-center">{checkout.emptyBag}</p>
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
                  className="w-full py-3.5 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-hover"
                >
                  {checkout.checkoutButton}
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
                  <span className="font-mono font-bold text-accent">{orderSuccess}</span>.
                </p>
                <button
                  onClick={() => setActiveModal("none")}
                  className="px-6 py-2.5 rounded-full bg-ink text-white text-xs font-medium"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <h3 className="font-serif text-2xl font-semibold">{checkout.title}</h3>
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
                      {checkout.districts.map((d) => (
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
                    {payments.map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        className={`py-2 px-3 rounded-lg border text-xs font-medium uppercase ${
                          paymentMethod === m
                            ? "border-accent bg-accent/10 text-accent"
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
                      Send <strong>৳{(subtotal + deliveryFee).toLocaleString()}</strong> {checkout.paymentText}
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
                    <span>Delivery ({district === checkout.insideDistrict ? checkout.insideLabel : checkout.outsideLabel})</span>
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
                  className="w-full py-3 rounded-full bg-ink text-white text-sm font-medium hover:bg-accent"
                >
                  {orderSubmitting ? "Placing Order..." : checkout.confirmButton}
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
            <h3 className="font-serif text-2xl font-semibold mb-4">{checkout.trackTitle}</h3>
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
                className="w-full py-2.5 rounded-full bg-ink text-white text-xs font-medium"
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
