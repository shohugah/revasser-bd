"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="shell py-24 text-center" role="alert">
      <h1 className="display-lg">Something slipped.</h1>
      <p className="mt-4 text-muted">Your bag is safe on this device. Please try again.</p>
      <button onClick={reset} className="btn-dark mt-8">Try again</button>
    </div>
  );
}
