import { useContext } from "react";
import styled from "styled-components";

import ThemeContext from "../contexts/ThemeContext";
import Icon from "./Icon";

/**
 * The light/dark toggle: a 56×32 pill whose knob slides between the moon and
 * the sun (300ms easeOutExpo) and shrinks on hover.
 */
export default function ThemeSwitch() {
  const [theme, setTheme] = useContext(ThemeContext);

  // Render
  return (
    <Styles
      aria-label="Switch theme"
      className="ui-theme-switch"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      type="button"
    >
      <Icon name="moon" size={12} />

      <Icon name="sun" size={12} />
    </Styles>
  );
}

const Styles = styled.button`
  width: 56px;
  height: 32px;
  border-radius: 16px;
  border: none;
  background: var(--bgMedium);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
  z-index: 1;
  cursor: pointer;
  flex-shrink: 0;

  &::before {
    content: "";
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--bgPrimary);
    position: absolute;
    z-index: -1;
    top: 2px;
    left: 26px;
    transition-property: left, transform;
    transition-duration: 300ms;
    transition-timing-function: var(--easeOutExpo);
  }

  :first-child {
    color: var(--textSoft);
  }

  &:hover::before {
    transform: scale(0.75);
  }

  .dark & {
    &::before {
      left: 2px;
    }

    :first-child {
      color: var(--highlight);
    }

    :last-child {
      color: var(--textSoft);
    }
  }
`;
