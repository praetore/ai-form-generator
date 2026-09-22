'use client';

import { useState } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import { schemaToHtml, schemaToReact } from '@/app/lib/schemaToCode';

type CopiedKind = 'html' | 'react' | null;

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export default function CopyButtons({ schema }: { schema: RJSFSchema }) {
  const [copied, setCopied] = useState<CopiedKind>(null);

  async function handleCopy(kind: 'html' | 'react') {
    const text = kind === 'html' ? schemaToHtml(schema) : schemaToReact(schema);
    await copyText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1600);
  }

  const buttonClassName =
    'inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground';

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button
        type="button"
        className={buttonClassName}
        onClick={() => handleCopy('html')}
      >
        {copied === 'html' ? 'HTML gekopieerd!' : 'Kopieer HTML'}
      </button>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => handleCopy('react')}
      >
        {copied === 'react' ? 'React gekopieerd!' : 'Kopieer React'}
      </button>
    </div>
  );
}
