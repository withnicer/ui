/** Six dots, the grip a row or a card is dragged by: the kit has no such icon. */
export default function Grip() {
  return (
    <svg aria-hidden="true" fill="currentColor" height={14} viewBox="0 0 10 16">
      {[2, 8, 14].flatMap((y) => [
        <circle cx={2.5} cy={y} key={`l${y}`} r={1.4} />,
        <circle cx={7.5} cy={y} key={`r${y}`} r={1.4} />,
      ])}
    </svg>
  );
}
