import { useCallback, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { type MessageKey } from "@/global";
import { type CsvResult } from "@/lib/command/csv";
import { Tree } from "@/lib/parser";
import { toastErr } from "@/lib/utils";
import { useEditor } from "@/stores/editorStore";
import { useTranslations } from "next-intl";
import { FileUploader } from "react-drag-drop-files";
import BasePopover from "./BasePopover";
import { type FileType, FileTypeSelect } from "./FileTypeSelect";

export default function ImportPopover() {
  const t = useTranslations();
  const [fileType, setFileType] = useState<FileType>("JSON");
  const [csvWithHeader, setCsvWithHeader] = useState<boolean>(true);
  const onFile = useOnFile(fileType, { csvWithHeader });

  return (
    <BasePopover
      title="Import"
      className="w-96"
      optionsNode={fileType === "CSV" && <CsvOptions checked={csvWithHeader} setChecked={setCsvWithHeader} />}
      extraNode={
        <FileUploader handleChange={onFile} types={["txt", "json", "csv"]} dropMessageStyle={{ color: "transparent" }}>
          <div className="flex items-center justify-center border border-dashed hover:cursor-pointer hover:border-rose-400 w-full h-64 mt-2 text-zinc-500">
            <p>{t("drop file")}</p>
          </div>
        </FileUploader>
      }
    >
      <span className="mr-1">{t("file type")}</span>
      <FileTypeSelect fileType={fileType} setFileType={setFileType} />
      {fileType !== "JSON" && <span className="ml-auto text-zinc-500">{t("convert to JSON")}</span>}
    </BasePopover>
  );
}

interface CsvOptionsProps {
  checked: boolean;
  setChecked: (checked: boolean) => void;
}

function CsvOptions({ checked, setChecked }: CsvOptionsProps) {
  const t = useTranslations();

  return (
    <div className="flex items-center space-x-2">
      <Checkbox id="csv-options" defaultChecked={checked} checked={checked} onCheckedChange={setChecked} />
      <label htmlFor="csv-options">{t("csv_with_header")}</label>
    </div>
  );
}

function useOnFile(fileType: FileType, options: { csvWithHeader?: boolean }) {
  const t = useTranslations();
  const main = useEditor("main");
  const secondary = useEditor("secondary");

  const onFile = useCallback(
    (file: File) => {
      if (!(main && secondary)) {
        return;
      }

      const reader = new FileReader();

      reader.onload = async (event) => {
        const fileContent = event.target?.result;
        if (typeof fileContent !== "string") {
          return;
        }

        let r: CsvResult = {
          text: fileContent,
        };

        if (fileType !== "JSON") {
          secondary.setTree({ treeObject: new Tree(fileContent).toObject() });

          if (fileType === "CSV") {
            r = await main.worker().csv2json(fileContent, { withHeader: options.csvWithHeader });
          }
          // TODO: consider to support yaml
        }

        if (r.errorKey) {
          toastErr(t(r.errorKey as MessageKey));
        } else {
          await main.parseAndSet(r.text ?? "");
        }
      };

      reader.readAsText(file);
    },
    [main, secondary, fileType, options],
  );

  return onFile;
}
