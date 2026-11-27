import Link from "next/link";

export default function AdminNotFound() {
  return (
    <p>
      That admin page does not exist. <Link href="/admin" className="text-[#2271b1] underline">Back to the dashboard</Link>
    </p>
  );
}
