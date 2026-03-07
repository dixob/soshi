export interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
}

export const FIELD_MAPPINGS: { target: string; label: string; aliases: string[] }[] = [
  { target: 'first_name', label: 'First Name', aliases: ['first name', 'first', 'fname', 'first_name'] },
  { target: 'last_name', label: 'Last Name', aliases: ['last name', 'last', 'lname', 'last_name', 'surname'] },
  { target: 'phone', label: 'Phone', aliases: ['phone', 'telephone', 'cell', 'mobile', 'phone number', 'phone_number'] },
  { target: 'email', label: 'Email', aliases: ['email', 'e-mail', 'email address', 'email_address'] },
  { target: 'address', label: 'Address', aliases: ['address', 'street', 'location'] },
  { target: 'communication_pref', label: 'Communication Preference', aliases: ['communication_pref', 'communication preference', 'comm pref', 'preferred contact', 'contact preference'] },
  { target: 'relationship_notes', label: 'Notes', aliases: ['notes', 'note', 'comments', 'relationship_notes', 'memo'] },
];

export function autoMapColumns(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const field of FIELD_MAPPINGS) {
    for (const header of headers) {
      if (field.aliases.includes(header.toLowerCase().trim())) {
        map[field.target] = header;
        break;
      }
    }
  }
  return map;
}
