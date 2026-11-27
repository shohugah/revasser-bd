import { BarChart3, FileText, LayoutDashboard, Package, Percent, Search, Settings, ShoppingCart, Star, Users } from "lucide-react";

export const SECTIONS = [
  { slug: "", name: "Dashboard", icon: LayoutDashboard, stage: 2, about: "Sales, order statuses and low stock at a glance." },
  { slug: "products", name: "Products", icon: Package, stage: 3, about: "Add, edit and hide products, upload photos, set prices and stock." },
  { slug: "orders", name: "Orders", icon: ShoppingCart, stage: 4, about: "See orders and change their status." },
  { slug: "customers", name: "Customers", icon: Users, stage: 5, about: "Customers built from your orders." },
  { slug: "coupons", name: "Coupons", icon: Percent, stage: 5, about: "Create and switch off discount codes." },
  { slug: "reviews", name: "Reviews", icon: Star, stage: 5, about: "Add and remove product reviews." },
  { slug: "analytics", name: "Analytics", icon: BarChart3, stage: 2, about: "Sales charts and best sellers." },
  { slug: "content", name: "Website Content", icon: FileText, stage: 6, about: "Home page, banners and policy pages." },
  { slug: "seo", name: "SEO", icon: Search, stage: 6, about: "Titles and descriptions for Google and sharing." },
  { slug: "settings", name: "Settings", icon: Settings, stage: 6, about: "Delivery fees, payments and shop details." },
];
