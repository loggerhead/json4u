"use client";

import * as React from "react";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { LeftTruncate, RightTruncate } from "@/components/ui/truncate";
import { type Kind } from "@/lib/editor/editor";
import { rootMarker, toPath, toPointer } from "@/lib/idgen";
import { cn } from "@/lib/utils";
import { useEditor } from "@/stores/editorStore";
import { useStatusStore } from "@/stores/statusStore";
import { useTree } from "@/stores/treeStore";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/shallow";

export default function StatusBar() {
  return (
    <div data-testid="statusbar" className="w-full min-h-fit h-statusbar px-4 py-1 flex text-xs gap-4">
      <JsonPath />
      <ParseErrorMsg kind="main" />
      <div className="ml-auto" />
      <ParseErrorMsg kind="secondary" />
      <CursorPosition />
    </div>
  );
}

function JsonPath() {
  const editor = useEditor();
  const tree = useTree();
  const id = useStatusStore((state) => state.revealPosition.treeNodeId);
  const setRevealPosition = useStatusStore((state) => state.setRevealPosition);

  if (!(editor && tree.valid() && id)) {
    return null;
  }

  const jsonPath = [rootMarker, ...toPath(id)];

  return (
    <Breadcrumb className="max-w-[80%]">
      <BreadcrumbList className="flex-nowrap whitespace-nowrap overflow-x-auto">
        {jsonPath.map((k, i) => (
          <Fragment key={`${i}-${k}`}>
            <BreadcrumbItem title={k} className="inline-block cursor-pointer max-w-max-key truncate">
              <BreadcrumbLink
                onClick={() => {
                  const id = toPointer(jsonPath.slice(1, i + 1));
                  const node = tree.node(id);
                  setRevealPosition({
                    treeNodeId: id,
                    type: tree.isGraphNode(node) ? "node" : "key",
                    from: "statusBar",
                  });
                }}
              >
                {k}
              </BreadcrumbLink>
            </BreadcrumbItem>
            {i < jsonPath.length - 1 ? <BreadcrumbSeparator /> : null}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

interface ParseErrorMsgProps {
  kind: Kind;
  className?: string;
}

function ParseErrorMsg({ kind }: ParseErrorMsgProps) {
  const t = useTranslations();
  const editor = useEditor(kind);
  const tree = useTree(kind);

  if (!(tree.text.trim() && tree.hasError())) {
    return null;
  }

  const { offset, length, context } = tree.errors![0];
  const [left, middle, right] = context;
  const { startLineNumber, startColumn } = editor?.range(offset, length)!;
  const msg = t("parse error", { startLineNumber, startColumn });

  return (
    <div
      data-testid="parse-error"
      className="flex text-error"
      onClick={() => editor?.revealPosition(startLineNumber, startColumn)}
    >
      <span className="mr-1">{msg}</span>
      <div className="flex bg-error-foreground">
        <LeftTruncate className="max-w-32" text={left} />
        <span className="font-bold">{middle}</span>
        <RightTruncate className="max-w-32" text={right} />
      </div>
    </div>
  );
}

interface CursorPositionProps {
  className?: string;
}

function CursorPosition({ className }: CursorPositionProps) {
  const t = useTranslations();
  const { cursorPosition, selectionLength } = useStatusStore(
    useShallow((state) => ({
      cursorPosition: state.cursorPosition,
      selectionLength: state.selectionLength,
    })),
  );

  if (cursorPosition.line === 0) {
    return null;
  }

  const position = `${cursorPosition.line}:${cursorPosition.column}`;
  const selection = t("selection", { selection: selectionLength });

  return (
    <div
      data-testid="cursor-position"
      className={cn("flex flex-wrap items-center gap-1.5 break-words text-muted-foreground", className)}
    >
      <span>{position}</span>
      {selectionLength > 0 && <span>{selection}</span>}
    </div>
  );
}
