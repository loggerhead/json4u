export default function StatusBar({ leftText, rightText }) {
  return (
    <div className="flex h-[22px] text-[12px] border-[0.5px] border-t-0 border-solid border-color statusbar">
      <div className="px-2.5 py-0.5 grow">{leftText}</div>
      <div className="px-2.5 py-0.5">{rightText}</div>
    </div>
  );
}
