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
import { Copy, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/shallow";

/**
 * Renders the status bar at the bottom of the editor, displaying information
 * such as JSON path, parsing errors, and cursor position.
 */
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

/**
 * Displays the JSON path of the currently selected node in the editor.
 * Allows users to click on a path segment to navigate to the corresponding node.
 */
function JsonPath() {
  const t = useTranslations();
  const editor = useEditor();
  const tree = useTree();
  const id = useStatusStore((state) => state.revealPosition.treeNodeId);
  const setRevealPosition = useStatusStore((state) => state.setRevealPosition);
  const [copied, setCopied] = React.useState(false);

  if (!(editor && tree.valid() && id)) {
    return null;
  }

  const jsonPath = [rootMarker, ...toPath(id)];
  const pathString = jsonPath.join(".");
  const Icon = copied ? Check : Copy;

  return (
    <Breadcrumb className="group max-w-[80%]">
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
                    target: tree.isGraphNode(node) ? "graphNode" : "keyValue",
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
        <div
          className="opacity-0 group-hover:opacity-100 hover:cursor-pointer transition-opacity duration-2000 ease-in-out"
          title={t("copy_json_path")}
          onClick={() => {
            navigator.clipboard.writeText(pathString).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1000);
            });
          }}
        >
          <Icon className="icon" />
        </div>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

interface ParseErrorMsgProps {
  kind: Kind;
  className?: string;
}

/**
 * Displays a message when a JSON parsing error occurs in the specified editor.
 * Clicking on the message reveals the position of the error in the editor.
 */
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
      className="flex text-error cursor-pointer"
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

/**
 * Displays the current cursor position (line and column number) and the length of the selection.
 */
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
