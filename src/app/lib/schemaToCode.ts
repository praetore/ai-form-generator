import type { RJSFSchema } from '@rjsf/utils'

const LABEL_CLASS = 'text-sm font-medium'
const INPUT_CLASS =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-400 dark:focus:ring-zinc-800'
const SECTION_CLASS =
  'flex flex-col gap-5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40'

function indent(level: number): string {
  return '  '.repeat(level)
}

function fieldLabel(schema: RJSFSchema, key: string): string {
  return schema.title || key
}

function jsxString(value: string): string {
  return `{${JSON.stringify(value)}}`
}

function inputType(schema: RJSFSchema): string {
  if (schema.format === 'email') return 'email'
  if (schema.format === 'date') return 'date'
  if (schema.format === 'date-time') return 'datetime-local'
  if (schema.format === 'uri') return 'url'
  if (schema.type === 'number' || schema.type === 'integer') return 'number'
  if (schema.type === 'boolean') return 'checkbox'
  return 'text'
}

function isTextarea(schema: RJSFSchema): boolean {
  return (
    schema.type === 'string' &&
    (schema.format === 'textarea' ||
      schema['ui:widget'] === 'textarea' ||
      (schema.maxLength ?? 0) > 200)
  )
}

function pathAccess(path: string[]): string {
  return path.map((segment) => `[${JSON.stringify(segment)}]`).join('')
}

function valueExpr(path: string[]): string {
  return `form${pathAccess(path)}`
}

function onChangeExpr(path: string[], cast?: 'number' | 'boolean'): string {
  const pathLiteral = JSON.stringify(path)
  if (cast === 'boolean') {
    return `(e) => setAtPath(${pathLiteral}, e.target.checked)`
  }
  if (cast === 'number') {
    return `(e) => setAtPath(${pathLiteral}, e.target.value === '' ? '' : Number(e.target.value))`
  }
  return `(e) => setAtPath(${pathLiteral}, e.target.value)`
}

function initialValue(schema: RJSFSchema): unknown {
  if (schema.default !== undefined) return schema.default
  if (schema.type === 'object' && schema.properties) {
    return Object.fromEntries(
      Object.entries(schema.properties).map(([key, value]) => [
        key,
        typeof value === 'object' && value !== null
          ? initialValue(value as RJSFSchema)
          : '',
      ]),
    )
  }
  if (schema.type === 'boolean') return false
  if (schema.type === 'array') return []
  return ''
}

function htmlForProperty(
  key: string,
  schema: RJSFSchema,
  required: Set<string>,
  level: number,
): string {
  const pad = indent(level)
  const label = fieldLabel(schema, key)
  const isRequired = required.has(key)

  if (schema.type === 'object' && schema.properties) {
    const nestedRequired = new Set(
      Array.isArray(schema.required) ? schema.required : [],
    )
    const fields = Object.entries(schema.properties)
      .map(([childKey, childSchema]) =>
        typeof childSchema === 'object' && childSchema !== null
          ? htmlForProperty(childKey, childSchema as RJSFSchema, nestedRequired, level + 1)
          : '',
      )
      .filter(Boolean)
      .join('\n\n')

    return [
      `${pad}<fieldset>`,
      `${pad}  <legend>${escapeHtml(label)}</legend>`,
      fields,
      `${pad}</fieldset>`,
    ].join('\n')
  }

  if (schema.enum) {
    const options = schema.enum
      .map(
        (value) =>
          `${pad}  <option value="${escapeHtml(String(value))}">${escapeHtml(String(value))}</option>`,
      )
      .join('\n')

    return [
      `${pad}<label for="${key}">${escapeHtml(label)}${isRequired ? ' *' : ''}</label>`,
      `${pad}<select id="${key}" name="${key}"${isRequired ? ' required' : ''}>`,
      options,
      `${pad}</select>`,
    ].join('\n')
  }

  if (schema.type === 'boolean') {
    return [
      `${pad}<label>`,
      `${pad}  <input type="checkbox" id="${key}" name="${key}" />`,
      `${pad}  ${escapeHtml(label)}`,
      `${pad}</label>`,
    ].join('\n')
  }

  const type = inputType(schema)

  if (isTextarea(schema)) {
    return [
      `${pad}<label for="${key}">${escapeHtml(label)}${isRequired ? ' *' : ''}</label>`,
      `${pad}<textarea id="${key}" name="${key}"${isRequired ? ' required' : ''}></textarea>`,
    ].join('\n')
  }

  return [
    `${pad}<label for="${key}">${escapeHtml(label)}${isRequired ? ' *' : ''}</label>`,
    `${pad}<input type="${type}" id="${key}" name="${key}"${isRequired ? ' required' : ''} />`,
  ].join('\n')
}

function reactForProperty(
  key: string,
  schema: RJSFSchema,
  required: Set<string>,
  path: string[],
  level: number,
): string {
  const pad = indent(level)
  const label = fieldLabel(schema, key)
  const isRequired = required.has(key)
  const id = path.join('-')
  const nextPath = [...path, key]

  if (schema.type === 'object' && schema.properties) {
    const nestedRequired = new Set(
      Array.isArray(schema.required) ? schema.required : [],
    )
    const fields = Object.entries(schema.properties)
      .map(([childKey, childSchema]) =>
        typeof childSchema === 'object' && childSchema !== null
          ? reactForProperty(
              childKey,
              childSchema as RJSFSchema,
              nestedRequired,
              nextPath,
              level + 1,
            )
          : '',
      )
      .filter(Boolean)
      .join('\n\n')

    return [
      `${pad}<section className="${SECTION_CLASS}">`,
      `${pad}  <h3 className="text-base font-semibold tracking-tight">${jsxString(label)}</h3>`,
      fields,
      `${pad}</section>`,
    ].join('\n')
  }

  if (schema.enum) {
    const options = schema.enum
      .map((value) => {
        const text = String(value)
        return `${pad}  <option value={${JSON.stringify(text)}}>${jsxString(text)}</option>`
      })
      .join('\n')

    return [
      `${pad}<div className="flex flex-col gap-2">`,
      `${pad}  <label htmlFor={${JSON.stringify(id)}} className="${LABEL_CLASS}">`,
      `${pad}    ${jsxString(label)}${isRequired ? ' *' : ''}`,
      `${pad}  </label>`,
      `${pad}  <select`,
      `${pad}    id={${JSON.stringify(id)}}`,
      `${pad}    className="${INPUT_CLASS}"`,
      `${pad}    value={String(${valueExpr(nextPath)} ?? '')}`,
      `${pad}    onChange={${onChangeExpr(nextPath)}}`,
      `${pad}    ${isRequired ? 'required' : ''}`,
      `${pad}  >`,
      options,
      `${pad}  </select>`,
      `${pad}</div>`,
    ].join('\n')
  }

  if (schema.type === 'boolean') {
    return [
      `${pad}<label className="flex items-center gap-2 text-sm">`,
      `${pad}  <input`,
      `${pad}    type="checkbox"`,
      `${pad}    id={${JSON.stringify(id)}}`,
      `${pad}    className="size-4 rounded border-zinc-300"`,
      `${pad}    checked={Boolean(${valueExpr(nextPath)})}`,
      `${pad}    onChange={${onChangeExpr(nextPath, 'boolean')}}`,
      `${pad}  />`,
      `${pad}  <span>${jsxString(label)}</span>`,
      `${pad}</label>`,
    ].join('\n')
  }

  const type = inputType(schema)
  const cast = type === 'number' ? 'number' : undefined
  const tag = isTextarea(schema) ? 'textarea' : 'input'
  const extra =
    tag === 'textarea'
      ? `${pad}    rows={4}`
      : `${pad}    type="${type}"`

  return [
    `${pad}<div className="flex flex-col gap-2">`,
    `${pad}  <label htmlFor={${JSON.stringify(id)}} className="${LABEL_CLASS}">`,
    `${pad}    ${jsxString(label)}${isRequired ? ' *' : ''}`,
    `${pad}  </label>`,
    `${pad}  <${tag}`,
    `${pad}    id={${JSON.stringify(id)}}`,
    extra,
    `${pad}    className="${INPUT_CLASS}"`,
    `${pad}    value={${valueExpr(nextPath)} ?? ''}`,
    `${pad}    onChange={${onChangeExpr(nextPath, cast)}}`,
    `${pad}    ${isRequired ? 'required' : ''}`,
    `${pad}  />`,
    `${pad}</div>`,
  ].join('\n')
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function schemaToHtml(schema: RJSFSchema): string {
  const title = schema.title ? `  <h2>${escapeHtml(schema.title)}</h2>\n` : ''
  const required = new Set(Array.isArray(schema.required) ? schema.required : [])
  const fields = Object.entries(schema.properties ?? {})
    .map(([key, value]) =>
      typeof value === 'object' && value !== null
        ? htmlForProperty(key, value as RJSFSchema, required, 1)
        : '',
    )
    .filter(Boolean)
    .join('\n\n')

  return `<form>\n${title}${fields}\n</form>\n`
}

export function schemaToReact(schema: RJSFSchema): string {
  const required = new Set(Array.isArray(schema.required) ? schema.required : [])
  const initial = JSON.stringify(initialValue(schema), null, 2)
  const title = schema.title
    ? `      <h2 className="text-xl font-semibold tracking-tight">${jsxString(schema.title)}</h2>\n\n`
    : ''

  const fields = Object.entries(schema.properties ?? {})
    .map(([key, value]) =>
      typeof value === 'object' && value !== null
        ? reactForProperty(key, value as RJSFSchema, required, [], 3)
        : '',
    )
    .filter(Boolean)
    .join('\n\n')

  return `'use client';

import { useState } from 'react';

function setPath(obj: Record<string, unknown>, path: string[], value: unknown) {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  const current = (obj[head] as Record<string, unknown>) ?? {};
  return {
    ...obj,
    [head]: rest.length === 0 ? value : setPath(current, rest, value),
  };
}

export default function GeneratedForm() {
  const [form, setForm] = useState(${initial});

  function setAtPath(path: string[], value: unknown) {
    setForm((prev) => setPath(prev as Record<string, unknown>, path, value));
  }

  return (
    <form className="flex w-full max-w-xl flex-col gap-5">
${title}${fields}
    </form>
  );
}
`
}
