import { z } from 'zod';

// Forbidden words/patterns for display names (German + English)
const FORBIDDEN_PATTERNS = [
  // German insults
  /hurensohn/i, /hure/i, /fotze/i, /wichser/i, /arschloch/i, /schwuchtel/i,
  /missgeburt/i, /spast/i, /behindert/i, /mongo/i, /kanake/i, /neger/i,
  /schlampe/i, /nutte/i, /bastard/i, /idiot/i, /vollidiot/i, /depp/i,
  /drecksau/i, /scheisse/i, /scheiße/i, /kacke/i, /pisser/i,
  
  // English insults
  /fuck/i, /shit/i, /bitch/i, /asshole/i, /cunt/i, /dick/i, /cock/i,
  /nigger/i, /nigga/i, /faggot/i, /retard/i, /whore/i, /slut/i,
  /bastard/i, /pussy/i, /piss/i,
  
  // Hate speech / extremism
  /nazi/i, /hitler/i, /heil/i, /sieg\s*heil/i, /88/i, /1488/i,
  /hakenkreuz/i, /swastika/i, /kkk/i, /ku\s*klux/i,
  /holocaust/i, /vergasen/i, /auschwitz/i,
  /jihad/i, /isis/i, /terrorist/i, /allahu\s*akbar/i,
  
  // Illegal content references
  /pedo/i, /pädophil/i, /kinderschänder/i, /cp\b/i, /child\s*porn/i,
  /kinderporn/i, /loli/i, /shota/i,
  
  // Impersonation / Fraud
  /admin/i, /moderator/i, /support/i, /official/i, /staff/i,
  /gründer/i, /founder/i, /ceo/i, /owner/i,
  
  // Drug references
  /cocaine/i, /kokain/i, /heroin/i, /meth/i, /dealer/i,
  
  // Violence
  /killer/i, /mörder/i, /murder/i, /rape/i, /vergewalt/i,
  /töten/i, /kill\s*you/i, /death\s*to/i, /tod\s*den/i,
];

// Check if a display name contains forbidden content
export function containsForbiddenContent(name: string): boolean {
  const trimmedName = name.trim().toLowerCase();
  
  // Check against all forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(trimmedName)) {
      return true;
    }
  }
  
  // Check for leetspeak variations (basic)
  const leetDecoded = trimmedName
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's');
  
  if (leetDecoded !== trimmedName) {
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(leetDecoded)) {
        return true;
      }
    }
  }
  
  return false;
}

// Zod schema for display name validation
export const displayNameSchema = z
  .string()
  .trim()
  .min(2, { message: "Anzeigename muss mindestens 2 Zeichen haben" })
  .max(30, { message: "Anzeigename darf maximal 30 Zeichen haben" })
  .regex(/^[a-zA-Z0-9äöüÄÖÜß\s._-]+$/, {
    message: "Nur Buchstaben, Zahlen, Leerzeichen, Punkte, Unterstriche und Bindestriche erlaubt"
  })
  .refine((name) => !containsForbiddenContent(name), {
    message: "Dieser Anzeigename ist nicht erlaubt"
  });

// Validate display name and return error message if invalid
export function validateDisplayName(name: string): { valid: boolean; error?: string } {
  const result = displayNameSchema.safeParse(name);
  
  if (!result.success) {
    return {
      valid: false,
      error: result.error.errors[0]?.message || "Ungültiger Anzeigename"
    };
  }
  
  return { valid: true };
}

// Validate testimonial text for forbidden content
export function validateTestimonialContent(text: string): { valid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: "Text darf nicht leer sein" };
  }
  
  if (containsForbiddenContent(text)) {
    return { 
      valid: false, 
      error: "Deine Bewertung enthält unzulässige Inhalte und kann nicht eingereicht werden." 
    };
  }
  
  return { valid: true };
}
