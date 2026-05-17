import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function extractRecipeFromText(text: string, sourceHint?: string): Promise<object> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Extract the recipe from the following ${sourceHint ?? 'content'} and return it as JSON.

Return ONLY valid JSON with this exact structure:
{
  "title": "string",
  "description": "string or null",
  "feeds_people": number or null,
  "prep_time_minutes": number or null,
  "cook_time_minutes": number or null,
  "total_time_minutes": number or null,
  "ingredients": [
    {
      "name": "string",
      "quantity": "string",
      "unit": "string or null",
      "notes": "string or null",
      "is_primary": boolean
    }
  ],
  "instructions": [
    {
      "step_number": number,
      "text": "string"
    }
  ],
  "suggested_tags": ["string"]
}

For "is_primary": mark ingredients as true if they are the main, expensive, or centerpiece ingredients (proteins, key produce, specialty items). Mark as false for pantry staples like salt, pepper, oil, common spices.

For "feeds_people": extract the number of people the dish feeds. If the recipe says "serves 4" or "makes 4 portions", use 4. If it says "makes 24 cookies", use null and leave it for the user.

Content:
${text}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in Claude response')

  return JSON.parse(jsonMatch[0])
}

export async function extractRecipeFromImages(imageBase64Array: string[]): Promise<object> {
  const imageContent = imageBase64Array.map((b64) => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: 'image/jpeg' as const,
      data: b64,
    },
  }))

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          ...imageContent,
          {
            type: 'text',
            text: `Extract the recipe from these images and return it as JSON.

Return ONLY valid JSON with this exact structure:
{
  "title": "string",
  "description": "string or null",
  "feeds_people": number or null,
  "prep_time_minutes": number or null,
  "cook_time_minutes": number or null,
  "total_time_minutes": number or null,
  "ingredients": [
    {
      "name": "string",
      "quantity": "string",
      "unit": "string or null",
      "notes": "string or null",
      "is_primary": boolean
    }
  ],
  "instructions": [
    {
      "step_number": number,
      "text": "string"
    }
  ],
  "suggested_tags": ["string"]
}

For "is_primary": mark main, expensive, or centerpiece ingredients as true. Common pantry staples (salt, pepper, oil, basic spices) as false.
For "feeds_people": number of people the dish feeds, or null if unclear.`,
          },
        ],
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude')

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in Claude response')

  return JSON.parse(jsonMatch[0])
}

type AnthropicContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }

type ChatContent = string | Array<{ type: 'text'; text: string } | { type: 'image'; data: string; mediaType: string }>

function toAnthropicContent(content: ChatContent): string | AnthropicContentBlock[] {
  if (typeof content === 'string') return content
  return content.map(block => {
    if (block.type === 'text') return { type: 'text' as const, text: block.text }
    return {
      type: 'image' as const,
      source: { type: 'base64' as const, media_type: block.mediaType, data: block.data },
    }
  })
}

export async function processPantryChat(
  messages: Array<{ role: 'user' | 'assistant'; content: ChatContent }>,
  currentPantry: Array<{ name: string; quantity?: string; unit?: string }>
): Promise<{ message: string; updates: PantryUpdate[] }> {
  const pantryList = currentPantry.length > 0
    ? currentPantry.map(i => `- ${i.name}${i.quantity ? ` (${i.quantity}${i.unit ? ' ' + i.unit : ''})` : ''}`).join('\n')
    : 'Empty'

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are a friendly kitchen assistant helping the user manage their pantry and fridge.

Current pantry contents:
${pantryList}

When the user tells you what they have, want to add, or want to remove, extract those changes and respond naturally.

Always respond with valid JSON in this format:
{
  "message": "your conversational response",
  "updates": [
    { "action": "add" | "remove" | "update", "name": "ingredient name", "quantity": "optional", "unit": "optional", "category": "optional" }
  ]
}

If no pantry changes are needed (e.g. user is just asking a question), return an empty updates array.
Categories: "produce", "protein", "dairy", "grains", "pantry", "spices", "frozen", "other"`,
    messages: messages.map(m => ({ role: m.role, content: toAnthropicContent(m.content) })),
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response')

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { message: content.text, updates: [] }

  return JSON.parse(jsonMatch[0])
}

export interface PantryUpdate {
  action: 'add' | 'remove' | 'update'
  name: string
  quantity?: string
  unit?: string
  category?: string
}
