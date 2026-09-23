import { cn } from '../../lib/cn.js';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('bg-white rounded-2xl shadow-sm border border-gray-100 p-5', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardSection({ className, children }) {
  return (
    <div className={cn('border-t border-gray-100 pt-4 mt-4', className)}>
      {children}
    </div>
  );
}
