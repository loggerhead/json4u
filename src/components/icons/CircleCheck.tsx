import { cn } from "@/lib/utils";

export default function CircleCheck({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center flex-shrink-0 w-4 h-4 mr-2 text-white rounded-full  bg-green-500",
        className,
      )}
    >
      <svg
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        className="w-3 h-3"
        viewBox="0 0 24 24"
      >
        <path fill="currentColor" d="M21 7L9 19l-5.5-5.5 1.41-1.41L9 16.17 19.59 5.59 21 7z"></path>
      </svg>
    </span>
  );
}
