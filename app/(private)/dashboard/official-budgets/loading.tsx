import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <div className="container space-y-4 px-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-52 w-full" /></div>;
}
