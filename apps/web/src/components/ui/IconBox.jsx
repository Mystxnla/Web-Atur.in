import { cn } from '../../lib/cn.js';

const colorMap = {
  primary: 'bg-primary-100 text-primary-600',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-orange-100 text-orange-600',
  danger: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
  gray: 'bg-gray-100 text-gray-600',
  teal: 'bg-teal-100 text-teal-600',
  blue: 'bg-blue-100 text-blue-600',
};

export default function IconBox({ icon: Icon, color = 'primary', size = 'md', className }) {
  const boxSize = size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-14 h-14' : 'w-11 h-11';
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  return (
    <div
      className={cn('rounded-xl flex items-center justify-center flex-shrink-0', boxSize, colorMap[color], className)}
      aria-hidden="true"
    >
      <Icon size={iconSize} />
    </div>
  );
}
