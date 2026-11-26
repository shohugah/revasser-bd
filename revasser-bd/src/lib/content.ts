import "server-only";
import fs from "fs";
import path from "path";
import { cache } from "react";
import { toWhatsAppNumber } from "./whatsapp";
import type { Availability, Category, Collection, Product, Review, StoreData } from "./types";

// Everything in /content is edited through Pages CMS. The editor can leave any
// optional field empty or missing, so every value gets a safe fallback here.
type Raw = Record<string, any>;

const root = path.join(process.cwd(), "content");
const read = (file: string): Raw => {
  const full = path.join(root, file);
  return fs.existsSync(full) ? JSON.parse(fs.readFileSync(full, "utf8")) ?? {} : {};
};
const readFolder = (folder: string) => {
  const dir = path.join(root, folder);
  if (!fs.existsSync(dir)) return []; // Git drops a folder when its last file is deleted.
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const item = read(`${folder}/${f}`);
      // File names come from titles typed in the editor, so make them URL-safe.
      const id = f.replace(/\.json$/, "").toLowerCase().replace(/[^a-z0-9ঀ-৿]+/g, "-").replace(/^-|-$/g, "");
      return { ...item, id } as Raw;
    })
    .filter((item) => item.visible !== false)
    .sort((a, b) => (num(a.order) || 9999) - (num(b.order) || 9999) || a.id.localeCompare(b.id));
};

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0);
const list = (v: unknown): any[] => (Array.isArray(v) ? v.filter((x) => x !== null && x !== "") : []);
const texts = <K extends string>(o: Raw, keys: readonly K[]) =>
  Object.fromEntries(keys.map((k) => [k, str(o[k])])) as Record<K, string>;

// Editable links must never be able to run script.
const link = (v: unknown, fallback = "/shop") =>
  /^(https?:\/\/|\/(?!\/)|#|tel:|mailto:)/i.test(str(v).trim()) ? str(v).trim() : fallback;
const image = (v: unknown) => (/^(https:\/\/|\/(?!\/))/.test(str(v).trim()) ? str(v).trim() : "");
const webLink = (v: unknown) => {
  const s = str(v).trim();
  if (/^https?:\/\/\S+$/i.test(s)) return s;
  return /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+\/\S*$/i.test(s) ? `https://${s}` : "";
};
const email = (v: unknown) => {
  const s = str(v).trim();
  return /^[^\s@?&:/]+@[^\s@?&:/]+\.[^\s@?&:/]+$/.test(s) ? s : "";
};
// Reviews with no name or no words are never shown.
const reviews = (v: unknown): Review[] =>
  list(v).map((r) => texts(r, ["name", "text", "source"] as const)).filter((r) => r.name && r.text);

export const getDesign = cache(() => {
  const d = read("design.json");
  const rgb = (value: unknown, fallback: string) => {
    const hex = /^#[0-9a-f]{6}$/i.test(str(value).trim()) ? str(value).trim() : fallback;
    return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");
  };
  return {
    headingFont: str(d.headingFont),
    bodyFont: str(d.bodyFont),
    variables: {
      "--accent": rgb(d.accent, "#B69A65"),
      "--accent-hover": rgb(d.accentHover, "#9C814F"),
      "--ink": rgb(d.dark, "#171717"),
      "--page": rgb(d.background, "#F7F5F0"),
      "--soft": rgb(d.soft, "#E8E1D6"),
      "--campaign": rgb(d.campaign, "#3A1620"),
    } as Record<string, string>,
  };
});

export const getSeo = cache(() => texts(read("seo.json"), ["title", "siteName", "description", "shareText"] as const));

export const getContent = cache(() => {
  const h = read("header.json");
  const b = read("banner.json");
  const f = read("footer.json");
  const c = read("checkout.json");
  const camp = read("campaign.json");
  const pre = read("preorder.json");
  const story = read("story.json");
  const social = read("social.json");

  const categories: Category[] = readFolder("categories").map((x) => ({
    id: str(x.id),
    name: str(x.name),
    slug: str(x.slug) || str(x.id),
    description: str(x.description),
    image: image(x.image || x.imageUrl),
    countLabel: str(x.countLabel),
    featured: x.featured === true,
  }));

  const collections: Collection[] = readFolder("collections").map((x) => ({
    id: str(x.id),
    name: str(x.name),
    slug: str(x.slug) || str(x.id),
    description: str(x.description),
    image: image(x.photo || x.photoUrl),
    categories: list(x.categories).map(str),
    featured: x.featured !== false,
  }));

  const products: Product[] = readFolder("products").map((x) => {
    const regular = num(x.price);
    const sale = num(x.salePrice);
    const onSale = sale > 0 && sale < regular;
    const images = [x.photo || x.photoUrl, ...list(x.morePhotos), ...list(x.morePhotoUrls)].map(image).filter(Boolean);
    return {
      id: str(x.id),
      name: str(x.name),
      category: str(x.category),
      categoryName: categories.find((k) => k.slug === x.category)?.name ?? "",
      images: Array.from(new Set(images)),
      price: regular > 0 ? (onSale ? sale : regular) : null,
      compareAt: onSale ? regular : null,
      // "Confirm on WhatsApp" is the old name for "Confirm by phone".
      availability: (x.availability === "Confirm on WhatsApp" ? "Confirm by phone" : ["In stock", "Pre-order", "Sold out", "Confirm by phone"].includes(x.availability) ? x.availability : "") as Availability,
      description: str(x.description),
      details: list(x.details).map(str),
      colours: list(x.colours).map((k) => ({ name: str(k.name), image: image(k.photo || k.photoUrl) })).filter((k) => k.name),
      sizes: list(x.sizes).map(str),
      isNew: x.isNew === true,
      bestSeller: x.bestSeller === true,
      order: num(x.order) || 9999,
      reviews: reviews(x.reviews),
    };
  });

  const checkout = {
    ...texts(c, [
      "bagTitle", "emptyBag", "checkoutButton", "title", "insideDistrict", "insideLabel", "outsideLabel",
      "confirmButton", "trackTitle",
    ] as const),
    whatsapp: toWhatsAppNumber(str(c.whatsapp)),
    insideFee: num(c.insideFee),
    outsideFee: num(c.outsideFee),
    districts: list(c.districts).map(str),
    cod: c.cod !== false,
  };

  const supportEmail = email(f.supportEmail);
  const payments = checkout.cod ? "Cash on Delivery" : "Online ordering is paused";
  // Policy pages quote live settings so they cannot drift from checkout.
  const fill = (s: unknown) =>
    str(s)
      .replaceAll("{insideFee}", checkout.insideFee.toLocaleString("en-US"))
      .replaceAll("{outsideFee}", checkout.outsideFee.toLocaleString("en-US"))
      .replaceAll("{payments}", payments)
      .replaceAll("{email}", supportEmail);

  return {
    products,
    categories,
    collections,
    checkout,
    sections: Array.from(
      new Set(list(read("sections.json").sections).filter((s) => s.show !== false).map((s) => str(s.section)))
    ),
    header: {
      ...texts(h, ["logoImage", "logoMain", "logoAccent", "badge", "searchPlaceholder", "trackLabel", "bagLabel"] as const),
      logoImage: image(h.logoImage),
      announcements: list(h.announcements).map(str),
      showTrack: h.showTrack !== false,
      nav: list(h.nav).map((n) => ({ label: str(n.label), href: link(n.link) })).filter((n) => n.label),
    },
    banner: {
      ...texts(b, ["tagline", "titleStart", "titleHighlight", "titleEnd", "text", "primaryButton", "secondButton", "photoDescription"] as const),
      primaryLink: link(b.primaryLink),
      secondLink: link(b.secondLink, "/pre-order"),
      image: image(b.photo || b.photoUrl),
      mobileImage: image(b.mobilePhoto || b.mobilePhotoUrl || b.photo || b.photoUrl),
    },
    headings: texts(read("headings.json"), [
      "collectionsTitle", "collectionsText", "newTitle", "newText", "bestTitle", "bestText", "categoriesTitle",
      "categoriesText", "viewAll", "shopTitle", "reviewsTitle", "sortFeatured", "sortNew", "sortLow", "sortHigh",
      "saveWord", "addButton", "priceOnRequest", "emptyTitle", "emptyText",
    ] as const),
    campaign: {
      ...texts(camp, ["line1", "line2", "line3", "text", "button"] as const),
      href: link(camp.link),
      photos: list(camp.photos).map((x) => ({ src: image(x.photo || x.photoUrl), alt: str(x.description) })).filter((x) => x.src),
    },
    preorder: {
      ...texts(pre, ["eyebrow", "title", "text", "button", "imageNote", "whatsappText"] as const),
      image: image(pre.photo || pre.photoUrl),
      secondImage: image(pre.secondPhoto || pre.secondPhotoUrl),
      steps: list(pre.steps).map((x) => texts(x, ["title", "text"] as const)),
    },
    story: {
      ...texts(story, ["eyebrow", "title", "text", "button", "photoDescription"] as const),
      image: image(story.photo || story.photoUrl),
    },
    social: {
      ...texts(social, ["title", "text"] as const),
      items: list(social.items)
        .map((x) => ({ src: image(x.photo || x.photoUrl), alt: str(x.description), href: webLink(x.link) }))
        .filter((x) => x.src),
    },
    join: texts(read("join.json"), ["title", "text", "button", "message"] as const),
    reviews: reviews(read("reviews.json").reviews),
    blocks: list(read("blocks.json").blocks).map((x) => ({
      ...texts(x, ["title", "text", "button"] as const),
      src: image(x.photo),
      href: x.link ? link(x.link) : "",
    })),
    benefits: list(read("benefits.json").items).map((x) => texts(x, ["icon", "title", "text"] as const)),
    pages: readFolder("pages").map((x) => ({
      slug: str(x.slug) || str(x.id),
      title: str(x.title),
      intro: fill(x.intro),
      sections: list(x.sections).map((s) => ({ title: str(s.title), text: fill(s.text) })),
    })),
    footer: {
      ...texts(f, ["about", "careTitle", "trackLink", "paymentsTitle", "paymentsText"] as const),
      careLines: list(f.careLines).map(str),
      supportLabel: str(f.supportLabel) || "Help & Support",
      supportEmail,
      socials: [
        { name: "Facebook", url: webLink(f.facebook) },
        { name: "Instagram", url: webLink(f.instagram) },
        { name: "TikTok", url: webLink(f.tiktok) },
      ].filter((s) => s.url),
    },
  };
});

export type Content = ReturnType<typeof getContent>;

export function getStoreData(): StoreData {
  const { products, categories, collections, checkout, headings, footer } = getContent();
  return {
    products,
    categories,
    collections,
    checkout,
    labels: { saveWord: headings.saveWord, addButton: headings.addButton, priceOnRequest: headings.priceOnRequest },
    store: { name: getSeo().siteName || "Revasser", email: footer.supportEmail },
  };
}

/** /shop/<slug> can be a category, a collection or one of the two built-in edits. */
export function getListing(slug: string) {
  const { products, categories, collections } = getContent();
  if (slug === "new-arrivals")
    return { name: "New Arrivals", description: "The latest pieces added to the edit.", image: "", products: products.filter((p) => p.isNew), categories: [] as string[] };
  if (slug === "best-sellers")
    return { name: "Best Sellers", description: "The pieces our customers choose most.", image: "", products: products.filter((p) => p.bestSeller), categories: [] as string[] };
  const collection = collections.find((x) => x.slug === slug);
  if (collection) return { ...collection, products: products.filter((p) => collection.categories.includes(p.category)) };
  const category = categories.find((x) => x.slug === slug);
  if (category) return { ...category, categories: [category.slug], products: products.filter((p) => p.category === category.slug) };
  return null;
}
