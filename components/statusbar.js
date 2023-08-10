export default function StatusBar({ children }) {
  return (
    <div className="h-[22px] text-[12px] border-[0.5px] border-t-0 border-solid border-color bg-slate-100">
      <div className="px-2.5 py-0.5 statusbar-color">{children}</div>
    </div>
  );
}
