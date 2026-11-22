export interface Review { name: string; text: string; source: string }
export interface Colour { name: string; image: string }
export type Availability = "" | "In stock" | "Pre-order" | "Sold out" | "Confirm on WhatsApp";

export interface Product {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  images: string[];
  /** null: the owner has not set a price, so the site asks the customer to confirm it on WhatsApp. */
  price: number | null;
  compareAt: number | null;
  availability: Availability;
  description: string;
  details: string[];
  colours: Colour[];
  sizes: string[];
  isNew: boolean;
  bestSeller: boolean;
  order: number;
  reviews: Review[];
}

export interface Category { id: string; slug: string; name: string; description: string; image: string; countLabel: string; featured: boolean }
export interface Collection { id: string; slug: string; name: string; description: string; image: string; categories: string[]; featured: boolean }
export interface NavItem { label: string; href: string }

/** The part of the content that the interactive components need in the browser. */
export interface StoreData {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  labels: { saveWord: string; addButton: string; priceOnRequest: string };
  checkout: {
    whatsapp: string; whatsappButton: string; confirmButton: string; title: string; bagTitle: string; emptyBag: string;
    checkoutButton: string; paymentText: string; insideDistrict: string; insideLabel: string; outsideLabel: string;
    insideFee: number; outsideFee: number; districts: string[]; cod: boolean; bkash: boolean; nagad: boolean;
  };
  store: { name: string; email: string };
}
