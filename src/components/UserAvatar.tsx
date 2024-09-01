import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  name: string;
  url?: string;
  className?: string;
}

export default function UserAvatar({ name, url, className }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      <AvatarImage src={url} alt={name} />
      <AvatarFallback>
        <span className="block w-full h-full flex-shrink-0 overflow-hidden rounded-full bg-rose-200">
          <span className="flex w-full h-full items-center justify-center font-medium uppercase text-slate-11">
            {name?.charAt(0) ?? "U"}
          </span>
        </span>
      </AvatarFallback>
    </Avatar>
  );
}
