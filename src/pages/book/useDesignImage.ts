import { useEffect, useRef, useState } from "react";

/**
 * The optional "design inspiration" photo: the picked file, a preview URL for
 * it, and the hidden file input that opens the picker. Each preview is an
 * object URL, which holds the image in memory until revoked, so the previous
 * one is released whenever it's replaced or the page unmounts.
 */
export const useDesignImage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) {
      setFile(picked);
      setPreview(URL.createObjectURL(picked));
    }
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return { file, preview, inputRef, onChange, clear };
};
