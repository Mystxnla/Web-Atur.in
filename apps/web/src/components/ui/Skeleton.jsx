import { cn } from '../../lib/cn.js';

export default function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-gray-200', className)}
      aria-hidden="true"
      {...props}
    />
  );
}
