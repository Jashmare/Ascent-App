import { useEffect, useRef } from 'react';

/** Shows an image stored as a Blob, releasing its object URL when it changes or unmounts. */
export function BlobImage({
  blob,
  alt,
  className,
}: {
  blob: Blob;
  alt: string;
  className?: string;
}) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const image = ref.current;
    if (!image) return;
    const url = URL.createObjectURL(blob);
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return <img ref={ref} alt={alt} className={className} decoding="async" />;
}
