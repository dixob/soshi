import type { ParsedData } from '@/lib/import-fields';

export async function parsePdf(buffer: ArrayBuffer): Promise<ParsedData> {
  // Step 1: Extract text with unpdf
  let extractedText = '';
  try {
    const { extractText } = await import('unpdf');
    const result = await extractText(new Uint8Array(buffer) as any);
    const textContent = result.text;
    extractedText = Array.isArray(textContent) ? textContent.join('\n') : String(textContent || '');
  } catch {
    // Text extraction failed — continue with empty text
  }

  if (extractedText.length < 20) {
    throw new Error(
      'Could not extract enough text from this PDF. It may be a scanned image. ' +
      'Try using the "Scan a Card" feature instead for image-based documents.'
    );
  }

  // Step 2: Use Claude to structure the extracted text into contact rows
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic();

  // Truncate very large PDFs
  const text = extractedText.slice(0, 100_000);

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Extract contact information from this text into a structured JSON format.

Return a JSON object with:
- "headers": array of column names found (e.g., ["First Name", "Last Name", "Phone", "Email", "Address"])
- "rows": array of objects where each key matches a header name

Only include contacts that have at least a first name. Normalize phone numbers and emails when possible.
If the text doesn't contain contact information, return {"headers": [], "rows": [], "error": "No contact data found"}.

Text:
${text}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response from AI');
  }

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = content.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  const parsed = JSON.parse(jsonStr);

  if (parsed.error || !parsed.rows?.length) {
    throw new Error(parsed.error || 'No contact data found in PDF');
  }

  return {
    headers: parsed.headers,
    rows: parsed.rows,
  };
}
