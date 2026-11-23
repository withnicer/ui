import styled from "styled-components";

import Button, { type ButtonProps } from "./Button";
import Icon from "./Icon";

export interface EmptyStateProps {
  /** What to do about it, under the text. */
  button?: ButtonProps;
  description: string;
  icon: string;
  title?: string;
}

/**
 * "Nothing here yet": a muted round icon, an optional bold title and a short
 * description, centred in whatever hosts it.
 */
export default function EmptyState({
  button,
  description,
  icon,
  title,
}: EmptyStateProps) {
  return (
    <Styles className="empty-state">
      {/* The root stretches to centre itself in its host; the body is
          content-sized, so tours spotlight `.empty-body` and anchor their
          tooltip to it instead of the tall stretched box. */}
      <div className="empty-body">
        <figure>
          <Icon name={icon} size={24} />
        </figure>

        {title ? <p className="t-xs empty-state-title">{title}</p> : null}
        <p className="t-xxs">{description}</p>
        {button ? <Button {...button} /> : null}
      </div>
    </Styles>
  );
}

const Styles = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--gray600);

  .empty-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  figure {
    width: 48px;
    height: 48px;
    /* In a short host (a 120px chart overlay) the circle would squash into a
       pill. */
    flex-shrink: 0;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
  }

  p {
    text-align: center;
    max-width: 240px;
    margin: 0;
  }

  .empty-state-title {
    font-weight: 600;
    color: var(--textNormal);
  }

  .dark & {
    color: var(--gray400);

    figure {
      background: rgba(255, 255, 255, 0.1);
    }
  }
`;
