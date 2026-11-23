import {
  type ChangeEvent,
  type DragEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import Button from "./Button";
import Icon from "./Icon";
import TextInput from "./TextInput";

/** An http(s) address, or nothing: no data:, blob: or script links. */
const webUrlOf = (text: string): string | null => {
  try {
    const url = new URL(text.trim());
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
};

const CLASS = {
  dragging: "ui-file-input dragging",
  idle: "ui-file-input",
  link: "ui-file-input link",
} as const;

interface FileInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** The picker button's words. */
  browseLabel?: string;
  /**
   * Something held over the host's module rather than the box: the host
   * takes the drop, the box only answers. Leave it out and the box takes
   * its own drops.
   */
  dragging?: { files: number } | null;
  icon?: string;
  inputValue?: File | File[];
  /** What it takes and how big, under the prompt. */
  label?: string;
  linkLabel?: string;
  /** Words for one and for several, as in "Drop to upload 2 files". */
  noun?: readonly [string, string];
  /** The files picked or dropped, besides `onChange`. */
  onFiles?: (files: File[]) => void;
  /** Offers Add a link, which turns the box into the field. */
  onLink?: (url: string) => void;
  /** The words over the hint; by default it asks for the file. */
  prompt?: string;
}

/**
 * THE way to hand files over, in every app: one dashed box that takes a
 * drop, the picker and, when the host offers it, a link. It keeps one height
 * in every state, so nothing under it moves: dragging lifts the arrow, and
 * Add a link turns the box itself into the field.
 */
export default function FileInput({
  browseLabel,
  dragging,
  icon = "upload",
  inputValue,
  label,
  linkLabel = "Link to a file or image",
  noun = ["file", "files"],
  onFiles,
  onLink,
  prompt,
  ...rest
}: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [own, setOwn] = useState<{ files: number } | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [linking, setLinking] = useState(false);
  const [value, setValue] = useState("");
  const url = webUrlOf(value);
  const hosted = dragging !== undefined;
  const held = hosted ? dragging : own;

  useEffect(() => {
    if (inputValue) {
      setFiles(
        (Array.isArray(inputValue) ? inputValue : [inputValue]) as File[]
      );
    }
  }, [inputValue]);

  // A host that lists the files itself keeps the prompt in the box.
  const take = (picked: File[]) => {
    if (onFiles) {
      onFiles(picked);
    } else {
      setFiles(picked);
    }
  };

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      take(Array.from(event.target.files));
    }
    rest.onChange?.(event);
    // The same file picked again is a new pick.
    if (onFiles) {
      event.target.value = "";
    }
  }

  const closeLink = () => {
    setValue("");
    setLinking(false);
  };
  const addLink = () => {
    if (url && onLink) {
      onLink(url);
      closeLink();
    }
  };
  // Inside a form: Enter adds the link instead of submitting, and Escape
  // closes the field, not the drawer around it.
  const onLinkKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addLink();
    } else if (event.key === "Escape") {
      event.stopPropagation();
      closeLink();
    }
  };

  // The box itself opens the picker; its buttons and field keep their own.
  const browse = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (
      !linking &&
      !rest.disabled &&
      !target.closest("button, input, a, .ui-text-input")
    ) {
      inputRef.current?.click();
    }
  };

  const ownDrag = hosted
    ? {}
    : {
        onDragLeave: (event: DragEvent<HTMLDivElement>) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setOwn(null);
          }
        },
        onDragOver: (event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          const count = Array.from(event.dataTransfer?.items ?? []).filter(
            (item) => item.kind === "file"
          ).length;
          setOwn((current) =>
            current?.files === count ? current : { files: count }
          );
        },
        onDrop: (event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          setOwn(null);
          if (event.dataTransfer?.files?.length) {
            take(Array.from(event.dataTransfer.files));
            rest.onChange?.({
              target: { files: event.dataTransfer.files },
            } as ChangeEvent<HTMLInputElement>);
          }
        },
      };

  const mode = linking ? "link" : held ? "dragging" : "idle";
  const count = held?.files ?? 0;
  const picked = files.map((file) => file.name).join(", ");
  const asked =
    prompt ?? `Select or drag your ${rest.multiple ? noun[1] : noun[0]}`;
  let lead = picked || asked;
  if (held) {
    lead =
      count === 0
        ? "Drop to add it"
        : `Drop to upload ${count} ${count === 1 ? noun[0] : noun[1]}`;
  }

  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- a click anywhere on the box is a shortcut; Browse is the keyboard's way in.
    <div className={CLASS[mode]} onClick={browse} {...ownDrag}>
      {/* Each state comes in on its own; the box keeps its height. */}
      <div className="stage" key={mode}>
        <span className="badge">
          <Icon name={linking ? "link" : icon} size={16} />
        </span>

        {linking ? (
          <>
            <div className="link-row">
              <TextInput
                autoComplete="off"
                autoFocus
                label={linkLabel}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={onLinkKeyDown}
                value={value}
              />
              <Button
                buttonType="tertiary"
                label="Cancel"
                onClick={closeLink}
                size="m"
                type="button"
              />
              <Button
                buttonType="primary"
                label="Add"
                onClick={addLink}
                size="m"
                state={url ? undefined : "disabled"}
                type="button"
              />
            </div>
            <span className="hint">
              It stays a link: it opens where it lives.
            </span>
          </>
        ) : (
          <>
            <span className="words">
              <span className="lead">{lead}</span>
              {label ? <span className="hint">{label}</span> : null}
            </span>
            {held ? null : (
              <span className="actions">
                <Button
                  buttonType="secondary"
                  label={
                    browseLabel ??
                    (rest.multiple
                      ? `Browse ${noun[1]}`
                      : `Choose a ${noun[0]}`)
                  }
                  onClick={() => inputRef.current?.click()}
                  size="s"
                  state={rest.disabled ? "disabled" : undefined}
                  type="button"
                />
                {onLink ? (
                  <Button
                    buttonType="secondary"
                    iconLeft="link"
                    label="Add a link"
                    onClick={() => setLinking(true)}
                    size="s"
                    type="button"
                  />
                ) : null}
              </span>
            )}
          </>
        )}
      </div>

      <input type="file" {...rest} onChange={handleFiles} ref={inputRef} />
    </div>
  );
}
