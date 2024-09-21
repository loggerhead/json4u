import { useSearchParams } from "next/navigation";

export default function useRedirectTo() {
  const searchParams = useSearchParams();
  return searchParams.get("redirectTo") ?? `${window.location.origin}/editor`;
}
