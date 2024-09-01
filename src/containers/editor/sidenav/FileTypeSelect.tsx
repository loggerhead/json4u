import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FileType = "JSON" | "CSV";

export interface FileTypeSelectProps {
  fileType: FileType;
  setFileType: (v: FileType) => void;
}

export function FileTypeSelect({ fileType, setFileType }: FileTypeSelectProps) {
  return (
    <Select onValueChange={(v) => setFileType(v as FileType)} defaultValue={fileType}>
      <SelectTrigger className="w-fit h-fit px-1 py-1">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="JSON">{"JSON"}</SelectItem>
          <SelectItem value="CSV">{"CSV"}</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
