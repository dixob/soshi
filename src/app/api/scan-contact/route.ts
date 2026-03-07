import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const image = formData.get('image') as File | null;

  if (!image) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

  if (image.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image too large. Maximum size is 10MB.' }, { status: 400 });
  }

  if (!image.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  const base64 = buffer.toString('base64');

  // Map common image MIME types to Anthropic's accepted types
  let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
  if (image.type === 'image/png') mediaType = 'image/png';
  else if (image.type === 'image/gif') mediaType = 'image/gif';
  else if (image.type === 'image/webp') mediaType = 'image/webp';

  try {
    const client = new Anthropic();

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Extract contact information from this image (business card, Rolodex card, letter, etc.).

Return ONLY a JSON object with these fields:
{
  "first_name": "string or null",
  "last_name": "string or null",
  "phone": "string or null",
  "email": "string or null",
  "address": "string or null",
  "communication_pref": "phone|email|text|mail|no_preference or null",
  "relationship_notes": "string or null — include any other info like job title, company name",
  "confidence": "high|medium|low",
  "raw_text": "all text visible in the image"
}

If you cannot extract any contact info, set confidence to "low" and explain in raw_text.
Return ONLY the JSON object, no markdown formatting.`,
            },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response from AI');
    }

    // Parse response — handle potential markdown wrapping
    let jsonStr = content.text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) jsonStr = jsonMatch[1];

    const parsed = JSON.parse(jsonStr);

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error('Scan-to-contact error:', err);
    const message = err instanceof Error ? err.message : 'Failed to process image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
