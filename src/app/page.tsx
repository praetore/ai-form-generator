'use client';

import { useActionState, useRef, useState } from 'react';
import Form from '@rjsf/shadcn';
import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { generateSchema } from '@/app/actions/generateSchema';
import { FaLinkedinIn, FaGithub } from 'react-icons/fa';
import Spinner from '@/app/components/spinner';
import ObjectFieldTemplate from '@/app/components/object-field-template';
import CopyButtons from '@/app/components/copy-buttons';

export default function Home() {
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [schema, action, pending] = useActionState(generateSchema, null);

  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20">
      <main className="row-start-2 flex w-full max-w-xl flex-col items-center gap-8 sm:items-start">
        <header className="w-full text-center">
          <h1 className="mb-2 text-2xl font-bold tracking-tight">
            AI Form Generator
          </h1>
          <p className="text-sm text-muted-foreground italic">
            Ja, dit is stiekem voor m’n sollicitatie bij MoreApp 😏
          </p>
        </header>

        <form
          action={action}
          ref={formRef}
          className="flex w-full flex-col gap-4"
        >
          <textarea
            name="prompt"
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            rows={3}
            placeholder="Wat voor formulier moet ik maken?"
          />
          <button
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
            type="submit"
            disabled={pending}
          >
            Genereer!
          </button>
        </form>

        {pending ? (
          <Spinner />
        ) : (
          schema && (
            <div className="w-full rounded-lg border border-border p-6 shadow-xs [&_[id*='title']]:mt-1 [&_[id*='title']]:mb-3 [&_[id*='title']_h5]:text-base [&_[id*='title']_h5]:font-semibold [&_[id*='title']_h5]:tracking-tight">
              <Form
                schema={schema as RJSFSchema}
                validator={validator}
                formData={formData}
                noHtml5Validate
                uiSchema={{ 'ui:submitButtonOptions': { norender: true } }}
                templates={{ ObjectFieldTemplate }}
                onChange={({ formData: next }) => setFormData(next ?? {})}
              />
              <CopyButtons schema={schema as RJSFSchema} />
            </div>
          )
        )}
      </main>

      <footer className="row-start-3 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
        <p>Gemaakt door Darryl Amatsetam</p>
        <a
          className="flex items-center gap-2 hover:text-foreground hover:underline hover:underline-offset-4"
          href="https://github.com/praetore"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaGithub />
          GitHub
        </a>
        <a
          className="flex items-center gap-2 hover:text-foreground hover:underline hover:underline-offset-4"
          href="https://www.linkedin.com/in/praetore/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaLinkedinIn />
          LinkedIn
        </a>
      </footer>
    </div>
  );
}
