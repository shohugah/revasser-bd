export function PageIntro({ eyebrow, title, text }: { eyebrow?: string; title: string; text?: string }) {
  return (
    <header className="pb-10 pt-12 lg:pb-16 lg:pt-20">
      {eyebrow && <p className="label mb-5 text-muted">{eyebrow}</p>}
      <h1 className="display-lg max-w-5xl">{title}</h1>
      {text && <p className="mt-5 max-w-xl text-muted">{text}</p>}
    </header>
  );
}
