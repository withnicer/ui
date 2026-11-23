export type HapticKind = "error" | "success" | "tap";

// One short pulse for a tap; two soft pulses, the platform's "success"
// rhythm, for a success; three firmer ones, unlike either, for a failure.
const VIBRATION: Record<HapticKind, number | number[]> = {
  error: [30, 50, 30, 50, 30],
  success: [14, 60, 22],
  tap: 10,
};

/** iPhone and iPad: iPadOS reports a Mac, and its touch points give it away. */
const isAppleTouchDevice = (): boolean =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);

/**
 * A short haptic for the few moments that deserve one: approving, saving,
 * committing to a booking ("tap"), a payment that went through ("success"),
 * a booking that could not be confirmed ("error").
 *
 * The web has no haptics API that reaches both phones, so there are two
 * paths. Where the Vibration API exists (Android), `navigator.vibrate`. iOS
 * has none, but since iOS 18 toggling a switch (`<input type="checkbox"
 * switch>`) plays the system haptic, also through a click on its label — so a
 * hidden one is toggled and dropped. That path is a WebKit quirk, not an API:
 * it only plays inside the user's tap (one tick, whatever the kind), Apple
 * reportedly closed it in iOS 26.5, and where it plays nothing it changes
 * nothing.
 *
 * Call it synchronously from the tap's handler, before any `await`. A caller
 * outside a tap (an effect, a timer) passes `{ inGesture: false }` and gets
 * the vibration only. It never throws: a haptic must not break the action.
 */
export const haptic = (
  kind: HapticKind = "tap",
  { inGesture = true }: { inGesture?: boolean } = {}
): void => {
  try {
    if (typeof navigator.vibrate === "function") {
      navigator.vibrate(VIBRATION[kind]);
      return;
    }
    if (!(inGesture && isAppleTouchDevice())) {
      return;
    }
    // Kept out of <body> and unrendered: the click never reaches the body's
    // click-outside listeners, and the label can't move focus to its switch.
    const label = document.createElement("label");
    label.style.display = "none";
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.setAttribute("switch", "");
    label.append(toggle);
    document.head.append(label);
    label.click();
    label.remove();
  } catch {
    // No haptics here, or the browser refused one: the action goes on.
  }
};
