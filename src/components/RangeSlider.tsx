interface RangeSliderProps {
  /** Names each thumb for screen readers: "Minimum price", "Maximum price". */
  labels?: [string, string];
  max: number;
  min: number;
  onChange: (value: [number, number]) => void;
  step?: number;
  value: [number, number];
}

/**
 * Two thumbs on one track, for picking a range (a price band). Two native
 * range inputs stacked on the `.ui-slider` track: keyboard and touch come
 * for free, and the thumbs can't cross — each one stops at the other.
 */
export default function RangeSlider({
  labels = ["Minimum", "Maximum"],
  max,
  min,
  onChange,
  step = 1,
  value,
}: RangeSliderProps) {
  const [low, high] = value;
  const span = Math.max(max - min, 1);
  const percent = (point: number) => ((point - min) / span) * 100;

  return (
    <div className="ui-slider">
      <figure
        style={{
          left: `${percent(low)}%`,
          width: `${percent(high) - percent(low)}%`,
        }}
      />
      <input
        aria-label={labels[0]}
        max={max}
        min={min}
        onChange={(event) =>
          onChange([Math.min(Number(event.target.value), high), high])
        }
        step={step}
        type="range"
        value={low}
      />
      <input
        aria-label={labels[1]}
        max={max}
        min={min}
        onChange={(event) =>
          onChange([low, Math.max(Number(event.target.value), low)])
        }
        step={step}
        type="range"
        value={high}
      />
    </div>
  );
}
