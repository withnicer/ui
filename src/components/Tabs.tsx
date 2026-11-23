import clsx from "clsx";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { HTMLAttributes } from "react";

interface Tab {
  /** Shown as a small badge after the label (e.g. a queue size, or "10,000+"). */
  count?: number | string;
  label: string;
  /** A small dot after the label: something in the tab waits, unsaved. */
  mark?: boolean;
  onClick: () => void;
}

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  /** Selected tab when the parent owns the selection (e.g. it lives in the URL). */
  activeIndex?: number;
  tabs: Tab[];
}

export default function Tabs({ activeIndex, tabs, ...rest }: TabsProps) {
  const [activeTab, setActiveTab] = useState<number>(activeIndex ?? 0);

  useEffect(() => {
    if (activeIndex !== undefined) {
      setActiveTab(activeIndex);
    }
  }, [activeIndex]);
  const [width, setWidth] = useState<number>(0);
  const [left, setLeft] = useState<number>(0);
  const tabRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  // The line under the open tab follows it as the tabs change size: a
  // count that arrives later widens the tabs it sits in.
  useLayoutEffect(() => {
    const measure = () => {
      const el = tabRefs.current[activeTab];
      if (el) {
        setWidth(el.offsetWidth);
        setLeft(el.offsetLeft);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    for (const tab of tabRefs.current) {
      if (tab) {
        observer.observe(tab);
      }
    }
    return () => observer.disconnect();
  }, [activeTab, tabs.length]);

  return (
    <div className="ui-tabs" {...rest}>
      {tabs.map((tab, index) => (
        <p
          className={clsx("t-xs", { active: activeTab === index })}
          key={tab.label}
          onClick={() => {
            setActiveTab(index);
            tab.onClick();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTab(index);
              tab.onClick();
            }
          }}
          ref={(element) => {
            tabRefs.current[index] = element;
          }}
          role="button"
          tabIndex={0}
        >
          {tab.label}
          {tab.mark ? <span aria-hidden="true" className="mark" /> : null}
          {tab.count === undefined ? null : (
            <span className="count t-xxxs">{tab.count}</span>
          )}
        </p>
      ))}

      <figure style={{ width, left }} />
    </div>
  );
}
