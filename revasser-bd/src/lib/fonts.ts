import {
  Bodoni_Moda, Cormorant_Garamond, EB_Garamond, Hind_Siliguri, Inter, Jost, Lora, Montserrat, Playfair_Display,
  Plus_Jakarta_Sans, Poppins,
} from "next/font/google";

// Only the two defaults are preloaded. The others download only if they are chosen in the editor.
const bodoni = Bodoni_Moda({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], display: "swap" });
const jost = Jost({ subsets: ["latin"], display: "swap" });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["500"], style: ["normal", "italic"], display: "swap", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], style: ["normal", "italic"], display: "swap", preload: false });
const lora = Lora({ subsets: ["latin"], style: ["normal", "italic"], display: "swap", preload: false });
const garamond = EB_Garamond({ subsets: ["latin"], style: ["normal", "italic"], display: "swap", preload: false });
const montserrat = Montserrat({ subsets: ["latin"], style: ["normal", "italic"], display: "swap", preload: false });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap", preload: false });
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500"], display: "swap", preload: false });
const siliguri = Hind_Siliguri({ subsets: ["bengali", "latin"], weight: ["400", "500"], display: "swap", preload: false });

const HEADING: Record<string, string> = {
  "Bodoni Moda": bodoni.style.fontFamily,
  "Cormorant Garamond": cormorant.style.fontFamily,
  "Playfair Display": playfair.style.fontFamily,
  Lora: lora.style.fontFamily,
  "EB Garamond": garamond.style.fontFamily,
  Montserrat: montserrat.style.fontFamily,
};
const BODY: Record<string, string> = {
  Jost: jost.style.fontFamily,
  "Plus Jakarta Sans": jakarta.style.fontFamily,
  Inter: inter.style.fontFamily,
  Poppins: poppins.style.fontFamily,
  "Hind Siliguri": siliguri.style.fontFamily,
};

export const fontVariables = (heading: string, body: string) => ({
  "--font-heading": HEADING[heading] ?? HEADING["Bodoni Moda"],
  "--font-body": BODY[body] ?? BODY.Jost,
});
