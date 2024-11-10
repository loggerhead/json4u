"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Command as Cmd,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandInputShortcut,
} from "@/components/ui/command";
import { type MessageKey } from "@/global";
import { useDebounceFn } from "@/lib/hooks";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTranslations } from "next-intl";

const commandGroupPaddingY = 4;
const searchMenuHeight = 300;

export interface SearchInputProps<T extends { id: string }> {
  search: (inputValue: string) => Promise<T[]> | T[];
  onSelect: (item: T) => void;
  itemHeight: number;
  Item: React.FC<T>;
  placeholder?: MessageKey;
  openListOnFocus?: boolean;
  bindShortcut?: "K" | "F";
  displayShortcut?: boolean;
  id?: string;
}

export default function SearchInput<T extends { id: string }>({
  search,
  onSelect,
  itemHeight,
  Item,
  placeholder,
  openListOnFocus,
  bindShortcut,
  displayShortcut,
  id,
}: SearchInputProps<T>) {
  const t = useTranslations();
  const commandRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const groupRef = useRef(null);

  const [initialed, setInitialed] = useState(false);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [items, setItems] = useState<T[]>([]);

  const onSearch = useDebounceFn(
    (input: string) => {
      (async () => {
        const items = (await Promise.resolve(search(input))) ?? [];
        setItems(items);
        setOpen(true);
      })();
    },
    100,
    [],
  );

  useEffect(() => {
    if (!initialed) {
      setInitialed(true);
      return;
    }

    if (inputValue || openListOnFocus) {
      onSearch(inputValue);
    } else {
      setOpen(false);
    }
  }, [inputValue, openListOnFocus]);

  // toggle the menu when ⌘ + bindShortcut is pressed
  useEffect(() => {
    if (bindShortcut) {
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === bindShortcut.toLowerCase() && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          e.stopPropagation();
          inputRef.current?.focus();
          setTimeout(() => inputRef.current?.select());
        }
      };

      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }
  }, [bindShortcut]);

  // register inputRef to window.searchComponents
  useEffect(() => {
    if (id) {
      if (!window.searchComponents) {
        window.searchComponents = {};
      }
      window.searchComponents[`${id}-input`] = inputRef.current;
    }
  }, [id]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => groupRef.current,
    estimateSize: () => itemHeight,
  });
  const virtualItems = virtualizer.getVirtualItems();
  const height =
    items.length > 0
      ? Math.min(items.length * itemHeight + 2 * commandGroupPaddingY, searchMenuHeight)
      : items.length && searchMenuHeight;

  return (
    <Cmd
      id={id}
      data-open={open}
      ref={commandRef}
      shouldFilter={false}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          setOpen(false);
        }
      }}
    >
      <CommandInput
        ref={inputRef}
        placeholder={placeholder ? t(placeholder) : undefined}
        onFocus={() => {
          if (openListOnFocus || inputValue.length > 0) {
            onSearch(inputValue);
            setOpen(true);
          }
          setTimeout(() => inputRef.current?.select());
        }}
        onBlur={(ev) => {
          // if click CommandItem, it will trigger onBlur first then onSelect,
          // so we need to check if the click is inside the CommandList to avoid closing the menu
          if (commandRef.current && !commandRef.current.contains(ev.relatedTarget as Node)) {
            setOpen(false);
          }
        }}
        onValueChange={setInputValue}
      >
        {displayShortcut && bindShortcut && <CommandInputShortcut>{`⌘ ${bindShortcut}`}</CommandInputShortcut>}
      </CommandInput>
      <CommandList>
        {items.length === 0 && <CommandEmpty>{t("no_results_found")}</CommandEmpty>}
        <CommandGroup
          ref={groupRef}
          className="scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-rounded scrollbar-thumb-slate-300 scrollbar-track-rounded"
          style={{
            height,
            paddingTop: height > 0 ? commandGroupPaddingY : 0,
            paddingBottom: height > 0 ? commandGroupPaddingY : 0,
            width: "100%",
            overflowY: "auto",
            contain: "strict",
          }}
          // Used for selecting the first item by default, but it sometimes does not work
          // see issue: https://github.com/pacocoursey/cmdk/issues/280
          defaultValue={items[0]?.id}
        >
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: "100%",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
              }}
            >
              {virtualItems.map(({ key, index }) => {
                const item = items[index];
                return (
                  <div key={key} data-index={index} ref={virtualizer.measureElement}>
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={() => {
                        onSelect(item);
                        setOpen(false);
                      }}
                    >
                      <Item {...item} />
                    </CommandItem>
                  </div>
                );
              })}
            </div>
          </div>
        </CommandGroup>
      </CommandList>
    </Cmd>
  );
}
