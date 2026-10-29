import type { ReactNode } from 'react';

// Ícones do app: todos com o mesmo traço (2 px, pontas redondas) num quadro de 24.

function Svg({ tam = 22, children, cheio }: { tam?: number; children: ReactNode; cheio?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={tam}
      height={tam}
      fill={cheio ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

type P = { tam?: number };

export const IconeFechar = ({ tam }: P) => (
  <Svg tam={tam}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const IconeSubir = ({ tam }: P) => (
  <Svg tam={tam}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Svg>
);
export const IconeLixo = ({ tam }: P) => (
  <Svg tam={tam}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </Svg>
);
export const IconeTrocar = ({ tam }: P) => (
  <Svg tam={tam}>
    <path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />
  </Svg>
);
export const IconeMais = ({ tam }: P) => (
  <Svg tam={tam}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const IconeCompartilhar = ({ tam }: P) => (
  <Svg tam={tam}>
    <path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
  </Svg>
);
export const IconeCheck = ({ tam }: P) => (
  <Svg tam={tam}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
export const IconeCiclo = ({ tam }: P) => (
  <Svg tam={tam}>
    <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
  </Svg>
);
export const IconeRitmo = ({ tam }: P) => (
  <Svg tam={tam}>
    <path d="M4.5 17a8 8 0 1 1 15 0" />
    <path d="M12 13l4-4" />
  </Svg>
);
export const IconeTreino = ({ tam }: P) => (
  <Svg tam={tam}>
    <path d="M3 17h3l2-6 3 10 3-14 2 10h5" />
  </Svg>
);
export const IconeMetas = ({ tam }: P) => (
  <Svg tam={tam}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="0.8" />
  </Svg>
);
export const IconePainel = ({ tam }: P) => (
  <Svg tam={tam}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Svg>
);
export const IconeAjustes = ({ tam }: P) => (
  <Svg tam={tam}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2.2" />
    <circle cx="10" cy="17" r="2.2" />
  </Svg>
);
export const IconePaleta = ({ tam }: P) => (
  <Svg tam={tam}>
    <path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-1.9 0-.6-.3-1-.6-1.4-.3-.4-.6-.8-.6-1.4 0-1.1.9-1.9 2-1.9H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z" />
    <circle cx="7.5" cy="11" r="1" />
    <circle cx="10" cy="7" r="1" />
    <circle cx="15" cy="7.5" r="1" />
  </Svg>
);
export const IconeRegua = ({ tam }: P) => (
  <Svg tam={tam}>
    <path d="M3 8h18v8H3zM7 8v4M11 8v3M15 8v4M19 8v3" />
  </Svg>
);
export const IconeEsteira = ({ tam }: P) => (
  <Svg tam={tam}>
    <path d="M3 17h15a3 3 0 0 0 0-6h-1M5 21h14M6 17l2-9h3" />
    <circle cx="14" cy="5" r="1.6" />
  </Svg>
);
export const IconeSom = ({ tam }: P) => (
  <Svg tam={tam}>
    <path d="M4 9v6h4l5 4V5L8 9z" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
  </Svg>
);
export const IconeMudo = ({ tam }: P) => (
  <Svg tam={tam}>
    <path d="M4 9v6h4l5 4V5L8 9z" />
    <path d="M17 9l5 6M22 9l-5 6" />
  </Svg>
);
export const IconeInfo = ({ tam }: P) => (
  <Svg tam={tam}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Svg>
);
export const IconeInclinacao = ({ tam }: P) => (
  <Svg tam={tam}>
    <path d="M3 19h18L3 9z" />
  </Svg>
);
export const IconePlay = ({ tam }: P) => (
  <Svg tam={tam} cheio>
    <path d="M8 5.5v13l11-6.5z" />
  </Svg>
);
export const IconePausa = ({ tam }: P) => (
  <Svg tam={tam} cheio>
    <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
  </Svg>
);
export const IconeAnterior = ({ tam }: P) => (
  <Svg tam={tam} cheio>
    <path d="M7 6v12M18 6l-9 6 9 6z" />
  </Svg>
);
export const IconeProximo = ({ tam }: P) => (
  <Svg tam={tam} cheio>
    <path d="M17 6v12M6 6l9 6-9 6z" />
  </Svg>
);
