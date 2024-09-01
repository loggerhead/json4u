import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { type MessageKey } from "@/global";
import { type CsvResult } from "@/lib/command/csv";
import { type EditorWrapper } from "@/lib/editor/editor";
import { Tree } from "@/lib/parser";
import { downloadFile, toastErr } from "@/lib/utils";
import { useEditor } from "@/stores/editorStore";
import { useStatusStore } from "@/stores/statusStore";
import { useTranslations } from "next-intl";
import BasePopover from "./BasePopover";
import { FileTypeSelect } from "./FileTypeSelect";

type FileType = "JSON" | "CSV";

export default function ExportPopover() {
  const t = useTranslations();
  const [fileType, setFileType] = useState<FileType>("JSON");
  const { onClickPreview, onClickDownload } = useOnClickButton(fileType);

  return (
    <BasePopover title="Export" className="w-96">
      <span>{t("export to")}</span>
      <FileTypeSelect fileType={fileType} setFileType={setFileType} />
      <div className="flex ml-auto gap-2">
        {fileType !== "JSON" && (
          <Button variant="outline" onClick={onClickPreview}>
            {t("preview")}
          </Button>
        )}
        <Button variant="outline" onClick={onClickDownload}>
          {t("download")}
        </Button>
      </div>
    </BasePopover>
  );
}

function useOnClickButton(fileType: FileType) {
  const t = useTranslations();
  const main = useEditor("main");
  const secondary = useEditor("secondary");
  const setViewMode = useStatusStore((state) => state.setViewMode);

  const onClickPreview = useCallback(async () => {
    if (!(main && secondary)) {
      return;
    }

    convert(t, main, fileType, (text) => {
      secondary.setTree({ treeObject: new Tree(text).toObject() }, false);
      secondary.revealPosition(1, 1, false);
      setViewMode("text");
    });
  }, [main, secondary, fileType]);

  const onClickDownload = useCallback(() => {
    if (!(main && secondary)) {
      return;
    }

    convert(t, main, fileType, (text) => {
      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      downloadFile(fileType, url);
      URL.revokeObjectURL(url);
    });
  }, [main, secondary, fileType]);

  return { onClickPreview, onClickDownload };
}

async function convert(
  t: ReturnType<typeof useTranslations>,
  main: EditorWrapper,
  fileType: FileType,
  onSucc: (text: string) => void,
) {
  let r: CsvResult = {
    text: main.text(),
  };

  if (fileType === "CSV") {
    const treeObject = main.tree.toObject();
    r = await main.worker().json2csv(treeObject);
  }

  if (r.errorKey) {
    toastErr(t(r.errorKey as MessageKey));
  } else {
    onSucc(r.text!);
  }
}
