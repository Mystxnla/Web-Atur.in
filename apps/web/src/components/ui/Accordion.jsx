import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function Accordion({ items, className }) {
  return (
    <AccordionPrimitive.Root type="single" collapsible className={cn('space-y-2', className)}>
      {items.map((item, i) => (
        <AccordionPrimitive.Item
          key={i}
          value={String(i)}
          className="border border-gray-200 rounded-xl overflow-hidden"
        >
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors [&[data-state=open]>svg]:rotate-180">
              {item.question}
              <ChevronDown size={16} className="text-gray-400 transition-transform duration-200 flex-shrink-0 ml-3" aria-hidden />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-up-and-fade data-[state=open]:slide-down-and-fade">
            <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
              {item.answer}
            </div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}
