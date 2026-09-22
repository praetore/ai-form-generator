'use server'

import type { RJSFSchema } from '@rjsf/utils'

function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/** Ensure every field has a readable title so RJSF doesn't show snake_case keys. */
function withReadableTitles(
  schema: RJSFSchema,
  keyHint?: string,
): RJSFSchema {
  const next: RJSFSchema = { ...schema }

  if (!next.title) {
    if (typeof next.description === 'string' && next.description.trim()) {
      next.title = next.description
      delete next.description
    } else if (keyHint) {
      next.title = humanizeKey(keyHint)
    }
  }

  if (next.properties && typeof next.properties === 'object') {
    next.properties = Object.fromEntries(
      Object.entries(next.properties).map(([key, value]) => [
        key,
        typeof value === 'object' && value !== null
          ? withReadableTitles(value as RJSFSchema, key)
          : value,
      ]),
    )
  }

  if (next.items && typeof next.items === 'object' && !Array.isArray(next.items)) {
    next.items = withReadableTitles(next.items as RJSFSchema)
  }

  return next
}

export async function generateSchema(
  _: RJSFSchema | null,
  formData: FormData,
): Promise<RJSFSchema> {
  const prompt = formData.get('prompt') as string
  if (!prompt) throw new Error('Prompt required')

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_API_KEY) throw new Error('Missing API key')

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: [
            'You generate JSON Schema (draft-07 style) objects for forms rendered with react-jsonschema-form.',
            'Every object and every property MUST have a human-readable Dutch "title" (e.g. "Achternaam", "Persoonsgegevens").',
            'Use concise titles as the main labels. Put extra explanation only in "description", never use snake_case as a title.',
            'Property keys may stay in snake_case; titles must be normal Dutch words.',
            'Output valid JSON only — no markdown, no code fences, no commentary.',
          ].join(' '),
        },
        {
          role: 'user',
          content: `Create a JSON schema for this prompt: "${prompt}"`,
        },
      ],
    }),
  })

  const json = await response.json()
  const content = json.choices?.[0]?.message?.content

  try {
    let cleaned = content

    if (typeof content === 'string') {
      cleaned = content
        .trim()
        .replace(/^```(?:json)?\n/, '')
        .replace(/\n```$/, '')
    }

    const schema = JSON.parse(cleaned || '{}') as RJSFSchema
    return withReadableTitles(schema)
  } catch {
    throw new Error('Failed to parse schema')
  }
}
