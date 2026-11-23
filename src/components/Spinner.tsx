interface SpinnerProps {
  color?: "dark" | "light";
  size?: number;
}

export default function Spinner({ size }: SpinnerProps) {
  return (
    <figure
      className="ui-spinner"
      style={{ width: size || undefined, height: size || undefined }}
    />
  );
}
