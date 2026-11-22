import Image from "next/image";

interface Props {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}

/** Fills its positioned parent. Photos pasted as web addresses are served as they are, so any host works. */
export function Photo({ src, alt, sizes, className = "", priority }: Props) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={72}
      unoptimized={/^https?:/.test(src)}
      className={`object-cover ${className}`}
    />
  );
}
