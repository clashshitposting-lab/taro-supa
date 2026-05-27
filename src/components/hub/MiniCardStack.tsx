interface Card {
  image_url: string;
  reversed?: boolean;
  name?: string;
}

interface Props {
  cards: Card[];
  size?: number;
}

export function MiniCardStack({ cards, size = 56 }: Props) {
  const list = cards.slice(0, 3);
  if (list.length === 0) return null;
  return (
    <div className="relative" style={{ width: size + list.length * 8, height: size * 1.5 }}>
      {list.map((c, i) => (
        <div
          key={i}
          className="tarot-frame absolute overflow-hidden bg-card/40 transition-transform duration-300 group-hover:rotate-0"
          style={{
            left: i * 8,
            top: i * 4,
            width: size,
            height: size * 1.5,
            transform: `rotate(${(i - 1) * 4}deg)`,
            zIndex: i,
          }}
        >
          {c.image_url ? (
            <img
              src={c.image_url}
              alt={c.name ?? ""}
              loading="lazy"
              className={`h-full w-full object-cover ${c.reversed ? "rotate-180" : ""}`}
            />
          ) : (
            <div className="card-back h-full w-full" />
          )}
        </div>
      ))}
    </div>
  );
}