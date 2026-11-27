import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-3xl">Page not found.</h1>
      <Link href="/" className="btn-dark">Home</Link>
    </div>
  );
}
