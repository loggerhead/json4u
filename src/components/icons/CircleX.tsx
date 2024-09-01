import { cn } from "@/lib/utils";

export default function CircleX({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center flex-shrink-0 w-4 h-4 text-white rounded-full  bg-gray-400",
        className,
      )}
      aria-hidden="true"
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
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path>
      </svg>
    </span>
  );
}
