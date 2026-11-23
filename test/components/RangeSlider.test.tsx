// @vitest-environment jsdom
import { expect, it, vi } from "vitest";

import RangeSlider from "../../src/components/RangeSlider";
import { change, getByRole, render } from "../support/render";

const priceBand = () => {
  const onChange = vi.fn();
  render(
    <RangeSlider
      labels={["Minimum price", "Maximum price"]}
      max={1000}
      min={0}
      onChange={onChange}
      value={[200, 600]}
    />
  );
  return onChange;
};

const thumb = (name: string) => getByRole("slider", name) as HTMLInputElement;

it.each([
  ["Minimum price", "350", [350, 600]],
  ["Maximum price", "800", [200, 800]],
])("moves the %s to %s", (name, to, band) => {
  const onChange = priceBand();

  change(thumb(name), to);

  expect(onChange).toHaveBeenCalledExactlyOnceWith(band);
});

it.each([
  ["Minimum price", "900", [600, 600]],
  ["Maximum price", "50", [200, 200]],
])("stops the %s dragged past the other at it", (name, to, band) => {
  const onChange = priceBand();

  change(thumb(name), to);

  expect(onChange).toHaveBeenCalledExactlyOnceWith(band);
});

it("names its thumbs for a screen reader when not told how", () => {
  render(<RangeSlider max={10} min={0} onChange={vi.fn()} value={[2, 8]} />);

  expect([thumb("Minimum").value, thumb("Maximum").value]).toEqual(["2", "8"]);
});
