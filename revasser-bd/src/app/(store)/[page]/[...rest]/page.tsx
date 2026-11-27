import { notFound } from "next/navigation";

// Any other unknown address shows the shop's own "not found" page, with header and footer.
export default function Unknown() {
  notFound();
}
