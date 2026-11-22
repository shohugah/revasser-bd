import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell flex flex-col items-center py-24 text-center">
      <img src="/brand/logo/monogram-gold.svg" alt="" className="h-20 w-20" />
      <h1 className="display-lg mt-8">This page has left the rail.</h1>
      <p className="mt-4 text-muted">The piece or page you wanted is not here any more.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link href="/shop" className="btn-dark">Shop the edit</Link>
        <Link href="/" className="btn-line">Home</Link>
      </div>
    </div>
  );
}
