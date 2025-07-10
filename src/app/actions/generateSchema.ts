'use server'

export async function generateSchema(_: any, formData: any): Promise<any> {
    const prompt = formData.get("prompt") as string;
    if (!prompt) throw new Error("Prompt required");

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) throw new Error("Missing API key");

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'openai/gpt-4o',
            messages: [
                { role: 'system', content: 'You generate JSON schemas for forms.' },
                { role: 'user', content: `Create a JSON schema for this prompt, do not output anything other then valid json: "${prompt}"` },
            ],
        }),
    });

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;

    try {
        let cleaned = content;

        if (typeof content === 'string') {
            // Remove triple backticks and optional language tag
            cleaned = content
                .trim()
                .replace(/^```(?:json)?\n/, '')  // remove ```json\n or ```\n at the start
                .replace(/\n```$/, '');          // remove ending ```
        }

        return JSON.parse(cleaned || '{}');
    } catch {
        throw new Error("Failed to parse schema");
    }
}
