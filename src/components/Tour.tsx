import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ACTIONS, EVENTS, Joyride, STATUS } from "react-joyride";
import type { EventData, Step, TooltipRenderProps } from "react-joyride";
import styled, { createGlobalStyle } from "styled-components";

import Button from "./Button";

export type TourStep = Omit<Step, "skipBeacon"> & {
  /**
   * When set, the Tour adds the `tour-highlighted` class to the step's target
   * while the step is active (and removes it when the step changes or the tour
   * closes). Useful for elements that need extra visual emphasis beyond the
   * spotlight hole — e.g. revealing hidden actions on hover-only menus.
   */
  highlight?: boolean;
  /**
   * "compact" sizes the hole to the target's CONTENT (measured with a
   * Range) instead of its padded box — for anchors like the bottom tabs,
   * which stretch a third of the screen while their icon + label sit in a
   * small centred cluster.
   */
  spotlight?: "compact";
  /**
   * Alternative takes on the same step, in order of preference: of the steps
   * sharing a `oneOf` key, only the first whose target is visible survives.
   * For a target that may or may not be there (a photo grid that only exists
   * once there are photos) with a fallback anchor that always is.
   */
  oneOf?: string;
  /**
   * Set when `onBeforeStep` is what PUTS the target on screen (switching a
   * tab, opening a panel). Such a step survives the "is the target visible"
   * filter below, since the check runs before the callback — only set it
   * when the callback guarantees the target.
   */
  bringsOwnTarget?: boolean;
  /** How long a `bringsOwnTarget` step waits for its target, then is passed over. */
  targetWaitMs?: number;
  /**
   * Clicking the target moves the tour on, as Next does: for a step that asks
   * the person to click it (a menu, then the option it opens).
   */
  advanceOnTargetClick?: boolean;
  /** Glides the target into view, if it isn't, before the step shows. */
  scrollToTarget?: boolean;
  /**
   * Runs just before the step is shown: switching to the tab the target
   * lives on, scrolling it into view — whatever the step needs the screen to
   * be doing.
   */
  onBeforeStep?: () => void;
};

interface TourProps {
  onClose?: () => void;
  run: boolean;
  setRun: (run: boolean) => void;
  steps: TourStep[];
}

const FADE_MS = 150;
const SPOTLIGHT_PADDING = 6;
const SPOTLIGHT_MARGIN = 8;
const SPOTLIGHT_MAX_RATIO = 0.6;
const HIGHLIGHT_CLASS = "tour-highlighted";
const TARGET_WAIT_MS = 2500;
const TARGET_RETRY_MS = 100;
/**
 * The bubble stays on the screen, even if that means covering part of a target
 * too big to leave it room. Measured against the window: the kit's default is
 * the target's own scroller, which a narrow rail can't fit a bubble inside.
 */
const FLOATING_OPTIONS = {
  flipOptions: { boundary: "clippingAncestors" as const },
  shiftOptions: {
    boundary: "clippingAncestors" as const,
    crossAxis: true,
    padding: 16,
    rootBoundary: "viewport" as const,
  },
};

const TourVisibilityContext = createContext<boolean>(true);
/** The steps passed over for lack of a target: the count doesn't include them. */
const TourPassedOverContext = createContext<readonly number[]>([]);

/** A scroll that reports no end still lets the step show, after this long. */
const SCROLL_SETTLE_MS = 700;
/** How clear of the box's edges a target must be to need no scrolling. */
const SCROLL_MARGIN = 24;

/**
 * Glides `element` to the middle of the one box that scrolls it, unless it's
 * already in view, and resolves when it gets there. Not `scrollIntoView`: that
 * also moves every box around it, even those with hidden overflow, and the whole
 * page slides out from under its header.
 */
const scrollToMiddle = (element: Element) =>
  new Promise<void>((resolve) => {
    let holder = element.parentElement;
    while (holder) {
      const box = holder;
      const { overflowY } = getComputedStyle(box);
      if (
        (overflowY === "auto" || overflowY === "scroll") &&
        box.scrollHeight > box.clientHeight
      ) {
        const area = box.getBoundingClientRect();
        const target = element.getBoundingClientRect();
        const inView =
          target.top >= area.top + SCROLL_MARGIN &&
          target.bottom <= area.bottom - SCROLL_MARGIN;
        const wanted =
          box.scrollTop +
          target.top +
          target.height / 2 -
          (area.top + area.height / 2);
        const top = Math.min(
          Math.max(wanted, 0),
          box.scrollHeight - box.clientHeight
        );
        if (inView || Math.abs(top - box.scrollTop) < 1) {
          resolve();
          return;
        }
        const arrived = () => {
          window.clearTimeout(timer);
          box.removeEventListener("scrollend", arrived);
          resolve();
        };
        const timer = window.setTimeout(arrived, SCROLL_SETTLE_MS);
        box.addEventListener("scrollend", arrived);
        box.scrollTo({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
          top,
        });
        return;
      }
      holder = holder.parentElement;
    }
    resolve();
  });

function CustomTooltip({
  index,
  step,
  size,
  isLastStep,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
}: TooltipRenderProps) {
  const visible = useContext(TourVisibilityContext);
  const passedOver = useContext(TourPassedOverContext);
  const passedBefore = passedOver.filter((passed) => passed < index).length;
  return (
    <TooltipCard {...tooltipProps} style={{ opacity: visible ? 1 : 0 }}>
      <div className="tooltip-top">
        <span className="step-counter t-xxs">
          Step {index + 1 - passedBefore} of {size - passedOver.length}
        </span>
        <button
          aria-label="Close tour"
          className="close"
          {...(skipProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          ×
        </button>
      </div>

      {step.title && <h3 className="t-s title">{step.title}</h3>}

      <div className="content t-xxs">{step.content}</div>

      <div className="tooltip-bottom">
        <button
          className="t-xxs skip"
          {...(skipProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          Skip tour
        </button>

        <div className="actions">
          {index > 0 && (
            <Button
              buttonType="secondary"
              label="Back"
              size="s"
              {...(backProps as object)}
            />
          )}
          <Button
            buttonType="primary"
            label={isLastStep ? "Finish" : "Next"}
            size="s"
            {...(primaryProps as object)}
          />
        </div>
      </div>
    </TooltipCard>
  );
}

function PersistentSpotlight({
  clickable = false,
  shape,
  run,
  target,
  visible,
}: {
  /** A click on the target goes through to it, past the click blocker. */
  clickable?: boolean;
  run: boolean;
  shape?: "compact";
  target: string | null;
  visible: boolean;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  // The hole takes the target's own corners: a circular target (the profile
  // globe) was getting a rounded rectangle around it, which swallowed the
  // controls above and below it.
  const [radius, setRadius] = useState<string>("12px");

  useEffect(() => {
    if (!(run && target)) {
      setRect(null);
      return;
    }

    const update = () => {
      const el = document.querySelector(target);
      if (el) {
        if (shape === "compact") {
          // The CONTENT's box, not the element's: a bottom tab is a third
          // of the screen wide, but its icon + label are a small cluster.
          const range = document.createRange();
          range.selectNodeContents(el);
          const contentRect = range.getBoundingClientRect();
          setRect(
            contentRect.width > 0 ? contentRect : el.getBoundingClientRect()
          );
        } else {
          setRect(el.getBoundingClientRect());
        }

        // Take the target's own corners when it HAS them (the circular
        // profile globe); a square target keeps the spotlight's own rounding
        // rather than turning the hole into a box.
        const targetRadius = getComputedStyle(el).borderRadius;

        setRadius(
          targetRadius && Number.parseFloat(targetRadius) !== 0
            ? targetRadius
            : "12px"
        );
      }
    };

    update();

    const interval = window.setInterval(update, 150);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [run, target, shape]);

  if (!(run && rect)) {
    return null;
  }

  // Clamped to the viewport, and never taller than SPOTLIGHT_MAX_RATIO of it:
  // a target can be far taller than the screen (a full photo gallery), and an
  // unclamped hole would spill off both ends and leave the tooltip nowhere to
  // sit. Highlighting the top of it reads the same and stays on screen.
  const top = Math.max(rect.top - SPOTLIGHT_PADDING, SPOTLIGHT_MARGIN);
  const bottom = Math.min(
    rect.bottom + SPOTLIGHT_PADDING,
    top + window.innerHeight * SPOTLIGHT_MAX_RATIO,
    window.innerHeight - SPOTLIGHT_MARGIN
  );
  const left = Math.max(rect.left - SPOTLIGHT_PADDING, SPOTLIGHT_MARGIN);
  const right = Math.min(
    rect.right + SPOTLIGHT_PADDING,
    window.innerWidth - SPOTLIGHT_MARGIN
  );

  const boxStyle = {
    top,
    left,
    width: Math.max(right - left, 0),
    height: Math.max(bottom - top, 0),
    borderRadius: radius,
  };

  return createPortal(
    <>
      <ClickBlocker />
      {/* The hole itself takes a click meant for the target: it sits over
          it, so a step that asks for that click passes it on. */}
      <SpotlightBox
        className={clickable ? "clickable" : undefined}
        onClick={() => {
          const element = target ? document.querySelector(target) : null;
          if (clickable && element instanceof HTMLElement) {
            element.click();
          }
        }}
        style={boxStyle}
      />
      <HoleCover style={{ ...boxStyle, opacity: visible ? 0 : 1 }} />
    </>,
    document.body
  );
}

export default function Tour({ steps, run, setRun, onClose }: TourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [resolvedSteps, setResolvedSteps] = useState<TourStep[]>([]);
  const [passedOver, setPassedOver] = useState<number[]>([]);
  const inTransition = useRef(false);
  const running = useRef(run);
  running.current = run;

  // Filter out steps whose target isn't currently in the DOM. Lets a single
  // tour definition gracefully handle roles/states where some elements don't
  // render (e.g. an advisor on a page with admin-only tabs, or the Earnings
  // page sitting on Commissions while a Referrals-specific step's target
  // only exists on the Referrals tab).
  //
  // Targets often appear after async data loads (e.g. chats list while a
  // loader is up), so if nothing resolves on the first pass we poll for a
  // few seconds before giving up.
  // Callers build their steps inline (they close over page state), so the
  // array identity changes on every parent render. Resolve against the LATEST
  // steps but only re-run when the set of targets actually changes — a scroll
  // that re-renders the page must not restart the tour.
  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const stepsKey = steps.map((step) => String(step.target)).join("|");

  useEffect(() => {
    if (!run) {
      setResolvedSteps([]);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    /*
      A generous cap: on a slow connection My Trips' chat list can take
      seconds, and a shorter budget made the replayed tour give up BEFORE
      the page had anything to spotlight — it just never appeared. The tour
      starts the moment the first target exists; the cap only bites when
      the page truly has nothing.
    */
    const MAX_ATTEMPTS = 40;
    const RETRY_MS = 200;
    /*
      How long a oneOf group may hold the tour for its preferred member.
      Waiting the FULL budget meant a profile with no photos (whose globe
      never comes) sat silent for seconds; one second is enough for real
      photos to land, then the fallback is the answer.
    */
    const GROUP_GRACE_ATTEMPTS = 5;

    const evaluate = () => {
      if (cancelled) {
        return;
      }
      const visibleSteps = stepsRef.current.filter((step) => {
        if (typeof step.target !== "string") {
          return false;
        }
        if (step.bringsOwnTarget) {
          return true;
        }

        // Present AND laid out: a target inside a `display: none` branch
        // (e.g. the account page's desktop-only gallery) resolves fine but
        // has no box, and the spotlight would be a zero-size hole.
        const element = document.querySelector(step.target);

        return Boolean(element && element.getClientRects().length > 0);
      });
      // A `oneOf` group is ordered by preference, and its preferred member is
      // often the one that arrives last (the globe exists only once the photos
      // load, while its fallback — the section around it — is there from the
      // first frame). Settling on the first pass would always pick the
      // fallback, so a group that hasn't got its first choice yet keeps
      // waiting like an empty result does.
      const groupsSettled =
        attempts >= GROUP_GRACE_ATTEMPTS ||
        stepsRef.current.every((step) => {
          if (!step.oneOf) {
            return true;
          }

          const preferred = stepsRef.current.find(
            (candidate) => candidate.oneOf === step.oneOf
          );

          return preferred ? visibleSteps.includes(preferred) : true;
        });

      if (attempts >= MAX_ATTEMPTS && visibleSteps.length === 0) {
        // Nothing to spotlight ever appeared — close instead of idling as
        // an invisible "running" tour that blocks the next replay.
        setRun(false);
        return;
      }

      if (
        (visibleSteps.length > 0 && groupsSettled) ||
        attempts >= MAX_ATTEMPTS
      ) {
        const taken = new Set<string>();
        setResolvedSteps(
          visibleSteps.filter((step) => {
            if (!(step.oneOf && taken.has(step.oneOf))) {
              if (step.oneOf) {
                taken.add(step.oneOf);
              }

              return true;
            }

            return false;
          })
        );

        return;
      }
      attempts++;
      window.setTimeout(evaluate, RETRY_MS);
    };

    evaluate();

    return () => {
      cancelled = true;
    };
  }, [run, stepsKey]);

  const joyrideSteps: Step[] = resolvedSteps.map((s) => ({
    ...s,
    floatingOptions: FLOATING_OPTIONS,
    skipBeacon: true,
  }));

  // The first step may also need its screen prepared (mobile starts on the
  // Chat tab, so a tour that opens on the itinerary has to switch first).
  const preparedFirst = useRef(false);
  useEffect(() => {
    if (!(run && resolvedSteps.length > 0)) {
      preparedFirst.current = false;
      return;
    }
    if (preparedFirst.current) {
      return;
    }
    preparedFirst.current = true;
    resolvedSteps[0].onBeforeStep?.();
  }, [run, resolvedSteps]);

  // Initial fade-in when the tour starts; reset state when it stops
  useEffect(() => {
    if (!run) {
      setVisible(false);
      setStepIndex(0);
      setPassedOver([]);
      return;
    }

    setVisible(false);
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [run]);

  // Toggle the `tour-highlighted` class on steps that opted in
  useEffect(() => {
    const step = resolvedSteps[stepIndex];
    if (!(run && step?.highlight && typeof step.target === "string")) {
      return;
    }

    const el = document.querySelector(step.target);
    el?.classList.add(HIGHLIGHT_CLASS);

    return () => {
      el?.classList.remove(HIGHLIGHT_CLASS);
    };
  }, [run, stepIndex, resolvedSteps]);

  const closeTour = () => {
    setVisible(false);
    setRun(false);
    inTransition.current = false;
    onClose?.();
  };

  const showStep = (nextIndex: number, direction: 1 | -1) => {
    const step = resolvedSteps[nextIndex];
    // Ran off an end looking for a step with something to point at.
    if (!step) {
      inTransition.current = false;
      if (direction === 1) {
        closeTour();
      } else {
        setVisible(true);
      }
      return;
    }

    // Put the next step's target on screen BEFORE the swap, so it exists by
    // the time Joyride positions against it.
    step.onBeforeStep?.();

    // Fade out → swap step while hidden → fade back in.
    setVisible(false);

    const startedAt = Date.now();
    const settle = () => {
      if (!running.current) {
        return;
      }
      const element =
        typeof step.target === "string"
          ? document.querySelector(step.target)
          : null;
      // A page the step just opened may still be loading its target; one
      // that never comes would stall Joyride, so the tour moves past it.
      if (step.bringsOwnTarget && !element?.getClientRects().length) {
        if (Date.now() - startedAt < (step.targetWaitMs ?? TARGET_WAIT_MS)) {
          window.setTimeout(settle, TARGET_RETRY_MS);
        } else {
          setPassedOver((passed) =>
            passed.includes(nextIndex) ? passed : [...passed, nextIndex]
          );
          showStep(nextIndex + direction, direction);
        }
        return;
      }
      const arrive = () => {
        if (!running.current) {
          return;
        }
        setStepIndex(nextIndex);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setVisible(true);
            inTransition.current = false;
          });
        });
      };
      if (step.scrollToTarget && element) {
        void scrollToMiddle(element).then(arrive);
      } else {
        arrive();
      }
    };

    window.setTimeout(settle, FADE_MS);
  };

  /** Moves one step on or back from `index`, as the Next and Back buttons do. */
  const move = (index: number, direction: 1 | -1) => {
    const nextIndex = index + direction;

    if (nextIndex >= resolvedSteps.length) {
      closeTour();
      return;
    }

    if (nextIndex < 0) {
      return;
    }

    if (inTransition.current) {
      return;
    }
    inTransition.current = true;

    showStep(nextIndex, direction);
  };

  // A step whose target the person clicks moves on as Next would: they did
  // what the step asked. The click is held while the bubble fades with its
  // target still there, then the target's own action runs: a menu option
  // that closes its menu at once left the bubble fading toward the corner.
  useEffect(() => {
    const step = resolvedSteps[stepIndex];
    if (
      !(
        run &&
        visible &&
        step?.advanceOnTargetClick &&
        typeof step.target === "string"
      )
    ) {
      return;
    }
    const target = step.target;
    const onClick = (event: MouseEvent) => {
      const clicked = (event.target as Element | null)?.closest?.(target);
      if (!(clicked instanceof HTMLElement)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setVisible(false);
      window.setTimeout(() => {
        clicked.click();
        move(stepIndex, 1);
      }, FADE_MS);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  });

  const handleCallback = (data: EventData) => {
    const { status, type, action, index } = data;

    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    const isClosed = action === ACTIONS.CLOSE;

    if (finishedStatuses.includes(status) || isClosed) {
      closeTour();
      return;
    }

    if (
      type === EVENTS.STEP_AFTER &&
      (action === ACTIONS.NEXT || action === ACTIONS.PREV)
    ) {
      move(index, action === ACTIONS.NEXT ? 1 : -1);
    }
  };

  const currentTarget =
    run && resolvedSteps.length > 0
      ? ((resolvedSteps[stepIndex]?.target as string | null) ?? null)
      : null;
  const currentShape =
    run && resolvedSteps.length > 0
      ? resolvedSteps[stepIndex]?.spotlight
      : undefined;

  // Don't even mount Joyride until we have at least one resolvable step —
  // otherwise it would render against a missing target and freeze.
  if (run && resolvedSteps.length === 0) {
    return null;
  }

  return (
    <>
      {run && <FloaterVisibilityStyle $fadeMs={FADE_MS} $visible={visible} />}
      <PersistentSpotlight
        clickable={
          run && resolvedSteps[stepIndex]?.advanceOnTargetClick === true
        }
        run={run}
        shape={currentShape}
        target={currentTarget}
        visible={visible}
      />
      {createPortal(
        <TourVisibilityContext.Provider value={visible}>
          <TourPassedOverContext.Provider value={passedOver}>
            <Joyride
              continuous
              // The buttons' titles: the last step's says what its label does.
              locale={{
                back: "Back",
                last: "Finish",
                next: "Next",
                skip: "Skip tour",
              }}
              onEvent={handleCallback}
              options={{
                arrowColor: "var(--bgPrimary)",
                buttons: ["back", "primary", "skip"],
                overlayClickAction: false,
                overlayColor: "transparent",
                primaryColor: "var(--highlight)",
                scrollOffset: 120,
                showProgress: false,
                skipScroll: true,
                zIndex: 1100,
              }}
              run={run}
              scrollToFirstStep
              stepIndex={stepIndex}
              steps={joyrideSteps}
              styles={{
                overlay: {
                  zIndex: 1100,
                  backgroundColor: "transparent",
                  mixBlendMode: "normal",
                  pointerEvents: "none",
                },
                spotlight: {
                  fill: "transparent",
                },
              }}
              tooltipComponent={CustomTooltip}
            />
          </TourPassedOverContext.Provider>
        </TourVisibilityContext.Provider>,
        document.body
      )}
    </>
  );
}

const ClickBlocker = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1097;
  background: transparent;
  pointer-events: auto;
`;

const SpotlightBox = styled.div`
  position: fixed;
  border-radius: 12px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
  pointer-events: auto;
  z-index: 1098;

  &.clickable {
    cursor: pointer;
  }
`;

const HoleCover = styled.div`
  position: fixed;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.55);
  pointer-events: none;
  z-index: 1099;
  transition: opacity ${FADE_MS}ms ease;
`;

const FloaterVisibilityStyle = createGlobalStyle<{
  $fadeMs: number;
  $visible: boolean;
}>`
  /* Joyride 3 names them react-joyride__*; the __floater names are its
     older ones. Without these the arrow stayed on screen while the bubble
     faded, and showed in the corner when its target went away. */
  .react-joyride__floater,
  .react-joyride__arrow,
  .__floater,
  .__floater__arrow,
  .__floater__arrow span {
    transition: opacity ${(p) => p.$fadeMs}ms ease !important;
    opacity: ${(p) => (p.$visible ? 1 : 0)} !important;
  }
`;

const TooltipCard = styled.div`
  width: 360px;
  max-width: calc(100vw - 32px);
  background: var(--bgPrimary);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--highlight);
  transition: opacity ${FADE_MS}ms ease;

  .tooltip-top {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .step-counter {
      color: var(--textSoft);
      letter-spacing: 0.4px;
    }

    .close {
      background: transparent;
      border: none;
      color: var(--textNormal);
      cursor: pointer;
      font-size: 22px;
      line-height: 1;
      padding: 0 4px;
    }
  }

  .title {
    margin: 0;
    line-height: 1.3;
  }

  .content {
    color: var(--textNormal);
    line-height: 1.6;

    /* A step that lists what a place holds: a lead line, then its points. */
    p {
      margin: 0;
    }

    ul {
      margin: 6px 0 0;
      padding-left: 18px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    li::marker {
      color: var(--textSoft);
    }

    b {
      color: var(--highlight);
      font-weight: 600;
    }
  }

  .tooltip-bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 4px;

    .skip {
      background: transparent;
      border: none;
      color: var(--textSoft);
      cursor: pointer;
      padding: 4px 0;
      text-decoration: underline;
      text-underline-offset: 3px;

      &:hover {
        color: var(--highlight);
      }
    }

    .actions {
      display: flex;
      gap: 8px;
    }
  }
`;
