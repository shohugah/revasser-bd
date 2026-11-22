import fs from "fs";
import path from "path";

// Everything in /content is edited through Pages CMS. The editor can leave any
// optional field empty or missing, so every value gets a safe fallback here.
type Raw = Record<string, any>;

const root = path.join(process.cwd(), "content");
const read = (file: string): Raw => JSON.parse(fs.readFileSync(path.join(root, file), "utf8")) ?? {};
const readFolder = (folder: string) => {
  const dir = path.join(root, folder);
  if (!fs.existsSync(dir)) return []; // Git drops a folder when its last file is deleted.
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ ...read(`${folder}/${f}`), id: f.replace(/\.json$/, "") }) as Raw)
    .filter((item) => item.visible !== false)
    .sort((a, b) => (num(a.order) || 9999) - (num(b.order) || 9999) || a.id.localeCompare(b.id));
};

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0);
const list = (v: unknown): any[] => (Array.isArray(v) ? v.filter((x) => x !== null && x !== "") : []);
const texts = <K extends string>(o: Raw, keys: readonly K[]) =>
  Object.fromEntries(keys.map((k) => [k, str(o[k])])) as Record<K, string>;
// Editable links must never be able to run script.
const link = (v: unknown) => (/^(https?:\/\/|\/|#|tel:|mailto:)/i.test(str(v).trim()) ? str(v).trim() : "#catalog");

export interface Product {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  images: string[];
  regularPrice: number;
  discountPrice?: number;
}

export function getDesign() {
  const d = read("design.json");
  const rgb = (value: unknown, fallback: string) => {
    const hex = /^#[0-9a-f]{6}$/i.test(str(value).trim()) ? str(value).trim() : fallback;
    return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");
  };
  const heading: Record<string, string> = {
    "Cormorant Garamond": "Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600",
    "Playfair Display": "Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600",
    Lora: "Lora:ital,wght@0,500;0,600;0,700;1,500;1,600",
    "EB Garamond": "EB+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600",
    Montserrat: "Montserrat:ital,wght@0,500;0,600;0,700;1,500;1,600",
  };
  const body: Record<string, string> = {
    "Plus Jakarta Sans": "Plus+Jakarta+Sans:wght@400;500;600;700",
    Inter: "Inter:wght@400;500;600;700",
    Poppins: "Poppins:wght@400;500;600;700",
    "Hind Siliguri": "Hind+Siliguri:wght@400;500;600;700",
  };
  const h = heading[d.headingFont] ? d.headingFont : "Cormorant Garamond";
  const b = body[d.bodyFont] ? d.bodyFont : "Plus Jakarta Sans";
  return {
    variables: {
      "--accent": rgb(d.accent, "#9E5B3B"),
      "--accent-hover": rgb(d.accentHover, "#82492E"),
      "--ink": rgb(d.dark, "#18181B"),
      "--page": rgb(d.background, "#FAF8F5"),
      "--font-heading": `'${h}'`,
      "--font-body": `'${b}'`,
    } as Record<string, string>,
    fontUrl: `https://fonts.googleapis.com/css2?family=${heading[h]}&family=${body[b]}&display=swap`,
  };
}

export const getSeo = () => texts(read("seo.json"), ["title", "siteName", "description", "shareText"] as const);

export function getContent() {
  const h = read("header.json");
  const b = read("banner.json");
  const f = read("footer.json");
  const c = read("checkout.json");

  const categories = readFolder("categories").map((x) => ({
    id: str(x.id),
    name: str(x.name),
    slug: str(x.slug) || str(x.id),
    image: str(x.image || x.imageUrl),
    countLabel: str(x.countLabel),
  }));

  const products: Product[] = readFolder("products").map((x) => {
    const regularPrice = num(x.price);
    const sale = num(x.salePrice);
    return {
      id: str(x.id),
      name: str(x.name),
      category: str(x.category),
      categoryName: categories.find((k) => k.slug === x.category)?.name ?? "",
      images: [str(x.photo || x.photoUrl)],
      regularPrice,
      discountPrice: sale > 0 && sale < regularPrice ? sale : undefined,
    };
  });

  return {
    products,
    categories,
    sections: Array.from(
      new Set(list(read("sections.json").sections).filter((s) => s.show !== false).map((s) => str(s.section)))
    ),
    header: {
      ...texts(h, ["logoImage", "logoMain", "logoAccent", "badge", "searchPlaceholder", "trackLabel", "bagLabel"] as const),
      announcements: list(h.announcements).map(str),
      showTrack: h.showTrack !== false,
    },
    banner: {
      ...texts(b, ["tagline", "titleStart", "titleHighlight", "titleEnd", "text", "primaryButton", "secondButton"] as const),
      primaryLink: link(b.primaryLink),
      stats: list(b.stats).map((x) => texts(x, ["value", "label"] as const)),
      photos: list(b.photos)
        .map((x) => ({ src: str(x.photo || x.photoUrl), description: str(x.description) }))
        .filter((x) => x.src),
    },
    headings: texts(read("headings.json"), [
      "categoriesTitle", "categoriesText", "showAll", "productsTitle", "showingWord", "productsWord",
      "sortFeatured", "sortLow", "sortHigh", "saveWord", "addButton",
    ] as const),
    blocks: {
      blocks: list(read("blocks.json").blocks).map((x) => ({
        ...texts(x, ["title", "text", "button"] as const),
        src: str(x.photo),
        link: x.link ? link(x.link) : "",
      })),
    },
    benefits: { items: list(read("benefits.json").items).map((x) => texts(x, ["icon", "title", "text"] as const)) },
    footer: {
      ...texts(f, ["about", "careTitle", "trackLink", "paymentsTitle", "paymentsText"] as const),
      careLines: list(f.careLines).map(str),
    },
    checkout: {
      ...texts(c, [
        "bagTitle", "emptyBag", "checkoutButton", "title", "insideDistrict", "insideLabel", "outsideLabel",
        "paymentText", "confirmButton", "trackTitle",
      ] as const),
      insideFee: num(c.insideFee),
      outsideFee: num(c.outsideFee),
      districts: list(c.districts).map(str),
      cod: c.cod !== false,
      bkash: c.bkash === true,
      nagad: c.nagad === true,
    },
  };
}

export type Content = ReturnType<typeof getContent>;
