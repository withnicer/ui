import type { Dispatch, ReactNode, SetStateAction } from "react";
import styled, { createGlobalStyle, keyframes } from "styled-components";

import Button, { type ButtonProps } from "./Button";
import Icon from "./Icon";

export interface DetailDrawerProps {
  buttons: ButtonProps[];
  children: ReactNode;
  /**
   * Adds a share button beside the close X. The drawer only reports the tap —
   * what gets shared (and how: native sheet vs clipboard) is the caller's.
   */
  onShare?: () => void;
  setVisible: Dispatch<SetStateAction<boolean>>;
}

/**
 * THE detail side panel — every search result, itinerary segment, order and
 * form drawer in the apps opens in this: a 640px panel sliding in from the
 * right over a dimmed page, scrolling content, and its actions pinned in the
 * footer. On a phone it takes the whole screen and rises from below.
 */
export default function DetailDrawer({
  buttons,
  children,
  onShare,
  setVisible,
}: DetailDrawerProps) {
  const actions = buttons.filter((item) => !item.hidden);

  return (
    <>
      <Styles id="segment-detail">
        <figure
          aria-label="Close"
          onClick={() => setVisible(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setVisible(false);
            }
          }}
          role="button"
          tabIndex={0}
        />

        <div>
          <button
            id="close-segment-detail"
            onClick={() => setVisible(false)}
            type="button"
          >
            <Icon misc name="misc-cancel" />
          </button>

          {onShare ? (
            <button
              aria-label="Share"
              id="share-segment-detail"
              onClick={onShare}
              type="button"
            >
              <Icon name="share" size={16} />
            </button>
          ) : null}

          <div className="scrolleable no-scrollbar">{children}</div>

          {actions.length > 0 ? (
            <footer>
              {actions.map((button) => (
                <Button key={button.label} {...button} />
              ))}
            </footer>
          ) : null}
        </div>
      </Styles>
      <DarkStyles />
    </>
  );
}

const slideIn = keyframes`
  to {
    margin-right: 0;
  }
`;

const slideUp = keyframes`
  from {
    transform: translateY(100%);
  }
  to {
    transform: none;
  }
`;

const Styles = styled.div`
  width: 100vw;
  /* dvh, not vh: on iOS 100vh runs under the browser toolbar and the footer
     actions drowned behind it. Desktop reads them the same. */
  height: 100dvh;
  overflow: hidden;
  position: fixed;
  z-index: 1000;
  top: 0;
  right: 0;
  /* Apps that define their own scrim keep it; the rest get the portal's. */
  background: var(--overlay, rgba(217, 217, 217, 0.6));
  display: flex;

  > figure {
    flex: 1;
  }

  > div {
    width: 640px;
    height: 100%;
    overflow: hidden;
    background: var(--bgPrimary);
    display: flex;
    flex-direction: column;
    margin-right: -640px;
    animation: ${slideIn} 600ms var(--easeOutExpo) forwards;

    /* On a phone the panel owns the whole screen and enters from BELOW —
       the sheet family's entrance, without its drag mechanics: content this
       heavy (fares, rooms, galleries) scrolls freely and only the X closes.
       Full screen, so no rounded corners to draw. */
    @media (max-width: 768px) {
      width: 100vw;
      margin-right: 0;
      animation: ${slideUp} 450ms var(--easeOutExpo) forwards;
    }

    #close-segment-detail,
    #share-segment-detail {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(5px);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      z-index: 1;
      top: 20px;
      right: 20px;
      cursor: pointer;
    }

    /* Beside the X, same chip. */
    #share-segment-detail {
      right: 68px;
    }

    > .scrolleable {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      /* A drawer scrolls one way. Anything wider than the panel is a bug in
         that content, not something to hand the user a scrollbar for. */
      overflow-x: hidden;
    }

    > footer {
      /* Over what scrolls: a positioned field would paint across its shadow. */
      position: relative;
      z-index: 1;
      /* Standalone (PWA) swaps the toolbar for a home indicator. */
      padding: 20px 20px calc(20px + env(safe-area-inset-bottom));
      background: var(--bgPrimary);
      box-shadow: 0 -2px 4px 0 rgba(0, 0, 0, 0.1);
      display: flex;
      gap: 16px;

      /* Black shadows don't read on dark surfaces — divide with a line. */
      body.dark & {
        box-shadow: none;
        border-top: 1px solid var(--borderMedium);
      }

      .ui-button {
        flex: 1;
        border-radius: 0;
      }
    }
  }
`;

const DarkStyles = createGlobalStyle`
  body.dark #segment-detail {
    background: rgba(64, 64, 64, .6);
  }
`;
