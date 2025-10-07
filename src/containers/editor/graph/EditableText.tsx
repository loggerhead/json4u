import { memo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import Popover from "./Popover";

interface EditableTextProps {
  classNames: string[];
  text: string;
  onDoubleClick: () => void;
  onClick: (e: React.MouseEvent) => void;
  onEdit: (value: string) => void;
  title: string;
  popoverWidth: number;
  editable?: boolean;
  widthInInput?: number;
}

const EditableText = memo((props: EditableTextProps) => {
  const classNamesWithoutHl = props.classNames.filter((c) => c !== "search-highlight");
  const [isInput, setIsInput] = useState(false);
  const [content, setContent] = useState(props.text);

  const callEdit = useCallback(() => {
    props.onEdit(content);
    setIsInput(false);
  }, [content, props]);

  return (
    <Popover width={props.popoverWidth} hlClassNames={classNamesWithoutHl} text={content}>
      {isInput ? (
        <input
          className={cn(...classNamesWithoutHl)}
          style={{ width: props.widthInInput }}
          value={content}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => setContent(e.target.value)}
          onFocus={(e) => e.target.select()}
          autoFocus
          onBlur={callEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
              callEdit();
            }
          }}
        />
      ) : (
        <div
          className={cn("hover:bg-yellow-100", ...props.classNames)}
          title={props.title}
          onClick={props.onClick}
          onDoubleClick={(e) => {
            if (props.editable) {
              e.stopPropagation();
              props.onDoubleClick();
              setIsInput(true);
            }
          }}
        >
          {content}
        </div>
      )}
    </Popover>
  );
});

EditableText.displayName = "EditableText";

export default EditableText;
