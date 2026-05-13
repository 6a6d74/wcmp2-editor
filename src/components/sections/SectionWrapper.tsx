import type { ReactNode } from 'react';

interface Props {
  id: string;
  title: string;
  required?: boolean;
  children: ReactNode;
}

export function SectionWrapper({ id, title, required, children }: Props) {
  return (
    <section id={id} className="scroll-mt-16 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        {title}
        {required && (
          <span className="text-xs font-normal text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
            required
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}
