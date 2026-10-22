import Image from "next/image";
import type { Product } from "@/types/product";
import { stores } from "@/data/catalog";
import { discountOf, formatPrice, savingsOf } from "@/lib/products";
import ExpiryBadge from "./ExpiryBadge";
import { StarIcon } from "./Icons";

/** Etiqueta inclinada de desconto: a assinatura visual do site. */
export function DiscountTag({ value, size = "md", className = "" }: { value: number; size?: "md" | "lg"; className?: string }) {
  return (
    <span className={`inline-block -skew-x-12 bg-hot text-white ${size === "lg" ? "px-4 py-1.5" : "px-2.5 py-1"} ${className}`}>
      <span className={`block skew-x-12 font-display leading-none ${size === "lg" ? "text-3xl sm:text-4xl" : "text-base sm:text-lg"}`}>-{value}%</span>
    </span>
  );
}

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const discount = discountOf(product);
  const savings = savingsOf(product);
  const store = stores[product.store];

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-square overflow-hidden bg-snow">
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 420px"
          className="object-contain p-[12%] mix-blend-multiply transition duration-500 group-hover:scale-[1.04]"
        />
        {discount > 0 && <DiscountTag value={discount} className="absolute left-3 top-3 sm:left-4 sm:top-4" />}
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <div className="min-h-5 text-[13px] font-medium sm:text-sm">
          {product.expiresAt ? (
            <ExpiryBadge expiresAt={product.expiresAt} />
          ) : product.freeShipping ? (
            <span className="text-deal">Frete grátis</span>
          ) : null}
        </div>

        <h3 className="mt-0.5 line-clamp-2 text-[15px] font-medium leading-snug sm:text-base">
          <a href={`/ir/${product.id}`} target="_blank" rel="sponsored noopener" className="after:absolute after:inset-0">
            {product.title}
          </a>
        </h3>
        <p className="mt-0.5 text-[15px] text-muted sm:text-base">
          {product.brand ? `${product.brand} · ` : ""}{store.name}
        </p>

        <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-semibold leading-none">{formatPrice(product.price)}</span>
          {product.oldPrice && discount > 0 && <span className="text-sm text-muted line-through">{formatPrice(product.oldPrice)}</span>}
        </p>
        {savings > 0 && <p className="mt-1 text-sm font-medium text-deal">Economize {formatPrice(savings)}</p>}

        {product.rating && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
            <span className="flex text-ink" aria-label={`Nota ${product.rating.toFixed(1)} de 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <StarIcon key={n} width={13} height={13} className={n <= Math.round(product.rating!) ? "" : "text-line"} />
              ))}
            </span>
            <span className="border border-line px-1">{product.rating.toFixed(1)}</span>
            {product.reviews && <span>({product.reviews.toLocaleString("pt-BR")})</span>}
          </p>
        )}

        {product.coupon && (
          <p className="mt-2 text-sm">
            Cupom <span className="border border-dashed border-ink px-1.5 py-0.5 font-medium tracking-wide">{product.coupon}</span>
          </p>
        )}

        {product.expiresAt && product.freeShipping && <p className="mt-1.5 text-sm font-medium text-deal">Frete grátis</p>}
      </div>
    </article>
  );
}
