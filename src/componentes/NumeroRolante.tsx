// Número que rola como um odômetro: cada dígito é uma fita de 0 a 9 que desliza até o valor.

const DIGITOS = '0123456789'.split('');

export function NumeroRolante({ texto, className = '' }: { texto: string; className?: string }) {
  const chars = texto.split('');
  return (
    <span className={`rolante ${className}`} role="text" aria-label={texto}>
      {chars.map((c, i) => {
        // Chave pela posição a partir da direita: "9,8" -> "10,0" mantém as casas alinhadas
        const pos = chars.length - i;
        if (!/\d/.test(c)) {
          return (
            <span key={`s${pos}`} className="rol-sep" aria-hidden="true">
              {c}
            </span>
          );
        }
        return (
          <span key={`d${pos}`} className="rol-col" aria-hidden="true">
            <span className="rol-fita" style={{ transform: `translateY(${-Number(c) * 10}%)` }}>
              {DIGITOS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
