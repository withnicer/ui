export interface SeparatorProps {
  orientation: "vertical" | "horizontal";
}

export default function Separator({ orientation }: SeparatorProps) {
  return <figure className={`ui-separator ${orientation}`} />;
}
