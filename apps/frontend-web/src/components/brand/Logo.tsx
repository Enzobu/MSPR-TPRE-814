import { useId } from 'react';

type LogoProps = Readonly<{
  // Côté du badge carré en px (le SVG est vectoriel, il scale proprement).
  size?: number;
  className?: string;
}>;

// Logo FutureKawa : badge café (dégradé brun) + grain de café vert stylisé avec
// sa fente. Auto-porté (son propre fond arrondi) — remplace l'ancien carré
// `bg-primary` + icône Lucide. Décoratif : le nom "FutureKawa" l'accompagne
// toujours, donc `aria-hidden`.
export function Logo({ size = 32, className }: LogoProps) {
  // id unique par instance pour éviter toute collision de <linearGradient>.
  const gradientId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="16"
          y1="0"
          x2="16"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#AE8056" />
          <stop offset="1" stopColor="#774B2B" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      <g transform="rotate(-20 16 16)">
        <ellipse cx="16" cy="16" rx="6.1" ry="8.6" fill="#FBF8F4" />
        <path
          d="M16.3 8.6C13.2 11.4 13.2 13.4 16 16C18.8 18.6 18.8 20.6 15.7 23.4"
          stroke="#6F4527"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
