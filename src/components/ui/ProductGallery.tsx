"use client";

import Image from "next/image";
import { useState } from "react";

/** Galeria da página do produto: foto grande e miniaturas (no celular, as fotos deslizam de lado). */
export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [atual, setAtual] = useState(0);
  return (
    <div className="lg:flex lg:flex-row-reverse lg:gap-4">
      {/* Celular: carrossel de lado com rolagem por toque. PC: uma foto grande. */}
      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto sm:mx-0 lg:hidden">
        {images.map((src, i) => (
          <div key={src} className="relative aspect-square w-full shrink-0 snap-center bg-snow">
            <Image src={src} alt={i === 0 ? alt : ""} fill priority={i === 0} sizes="100vw" className="object-contain p-6 mix-blend-multiply" />
            {images.length > 1 && <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium">{i + 1}/{images.length}</span>}
          </div>
        ))}
      </div>
      <div className="relative hidden aspect-square flex-1 bg-snow lg:block">
        <Image src={images[atual]} alt={alt} fill priority sizes="50vw" className="object-contain p-10 mix-blend-multiply" />
      </div>
      {images.length > 1 && (
        <ul className="hidden w-20 shrink-0 flex-col gap-2 lg:flex">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onMouseEnter={() => setAtual(i)}
                onClick={() => setAtual(i)}
                aria-label={`Foto ${i + 1}`}
                aria-current={i === atual}
                className={`relative block aspect-square w-full bg-snow transition ${i === atual ? "ring-2 ring-ink" : "opacity-70 hover:opacity-100"}`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-contain p-1.5 mix-blend-multiply" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
