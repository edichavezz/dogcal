import twilio from 'twilio';

export type NotificationResult = {
  userId: string;
  userName: string;
  phoneNumber: string | null;
  status: 'sent' | 'skipped' | 'failed';
  reason?: string;
  twilioSid?: string;
};

// WhatsApp Message Template SIDs
export const TEMPLATE_SIDS = {
  hangout_created: 'HX9101474e143c82f229805d085d79e798',
  hangout_assigned: 'HX8ca533abdca8a345b8a3998db13a66d5',
  suggestion_created: 'HX85b0ae5f77c05bd9d7f40c28abac35f6',
  hangout_unassigned: 'HXfa18269f9cee0dd396205c31afb71c85',
} as const;

export type TemplateName = keyof typeof TEMPLATE_SIDS;

type SendResult = {
  success: boolean;
  error?: string;
  sid?: string;
};

/**
 * Check if WhatsApp notifications are enabled via environment variable
 */
export function isWhatsAppEnabled(): boolean {
  return process.env.WHATSAPP_ENABLED === 'true';
}

/**
 * Initialize Twilio client
 * Returns null if credentials are missing
 */
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.error('Twilio credentials missing in environment variables');
    return null;
  }

  return twilio(accountSid, authToken);
}

/**
 * Validate if a phone number is valid for WhatsApp
 * Returns true if phone number exists and is not empty
 */
export function isValidPhoneNumber(phone: string | null | undefined): boolean {
  if (!phone) return false;

  // Remove whitespace and check if there's content
  const cleaned = phone.trim();
  if (cleaned.length === 0) return false;

  // Basic validation: should contain digits
  const hasDigits = /\d/.test(cleaned);

  return hasDigits;
}

/**
 * Format phone number for Twilio WhatsApp API
 * Handles UK (+44) and US (+1) numbers
 * Returns in format: whatsapp:+1234567890
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.trim();

  // Check if it starts with + and preserve it
  const hasPlus = cleaned.startsWith('+');
  cleaned = cleaned.replace(/\D/g, '');

  // UK number handling: 07xxx becomes 447xxx
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '44' + cleaned.substring(1);
  }

  // If already starts with country code (44 for UK, 1 for US), keep it
  if (cleaned.startsWith('44') || cleaned.startsWith('1')) {
    // Already has country code
  }
  // If it's a 10-digit US number, add +1
  else if (cleaned.length === 10) {
    cleaned = '1' + cleaned;
  }

  // Return in Twilio WhatsApp format
  return `whatsapp:+${cleaned}`;
}

/**
 * Send a WhatsApp message via Twilio
 * Returns result indicating success/failure
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<SendResult> {
  // Check if WhatsApp is enabled
  if (!isWhatsAppEnabled()) {
    return {
      success: false,
      error: 'WhatsApp notifications are disabled',
    };
  }

  // Get Twilio client
  const client = getTwilioClient();
  if (!client) {
    return {
      success: false,
      error: 'Twilio client not configured',
    };
  }

  // Get WhatsApp from number
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) {
    return {
      success: false,
      error: 'TWILIO_WHATSAPP_FROM not configured',
    };
  }

  try {
    // Format the recipient number
    const formattedTo = formatPhoneNumber(to);

    console.log(`[WhatsApp] Sending message:`);
    console.log(`  From: ${from}`);
    console.log(`  To (original): ${to}`);
    console.log(`  To (formatted): ${formattedTo}`);

    // Send message via Twilio
    const twilioMessage = await client.messages.create({
      body: message,
      from: from,
      to: formattedTo,
    });

    console.log(`[WhatsApp] Message sent successfully. SID: ${twilioMessage.sid}`);

    return {
      success: true,
      sid: twilioMessage.sid,
    };
  } catch (error) {
    console.error('[WhatsApp] Error sending message:', error);

    // Extract error message - Twilio errors have more detail
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
      // Twilio errors often have a code property
      const twilioError = error as Error & { code?: number; moreInfo?: string };
      if (twilioError.code) {
        errorMessage = `Twilio error ${twilioError.code}: ${error.message}`;
        console.error(`[WhatsApp] Twilio error code: ${twilioError.code}`);
        console.error(`[WhatsApp] More info: ${twilioError.moreInfo || 'N/A'}`);
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send a WhatsApp template message via Twilio Content API
 * This is required for initiating conversations (outside 24-hour window)
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: TemplateName,
  variables: Record<string, string>
): Promise<SendResult> {
  // Check if WhatsApp is enabled
  if (!isWhatsAppEnabled()) {
    return {
      success: false,
      error: 'WhatsApp notifications are disabled',
    };
  }

  // Get Twilio client
  const client = getTwilioClient();
  if (!client) {
    return {
      success: false,
      error: 'Twilio client not configured',
    };
  }

  // Get WhatsApp from number
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from) {
    return {
      success: false,
      error: 'TWILIO_WHATSAPP_FROM not configured',
    };
  }

  const contentSid = TEMPLATE_SIDS[templateName];

  try {
    // Format the recipient number
    const formattedTo = formatPhoneNumber(to);

    console.log(`[WhatsApp] Sending template message:`);
    console.log(`  Template: ${templateName} (${contentSid})`);
    console.log(`  From: ${from}`);
    console.log(`  To (original): ${to}`);
    console.log(`  To (formatted): ${formattedTo}`);
    console.log(`  Variables:`, variables);

    // Send message via Twilio Content API
    const twilioMessage = await client.messages.create({
      from: from,
      to: formattedTo,
      contentSid: contentSid,
      contentVariables: JSON.stringify(variables),
    });

    console.log(`[WhatsApp] Template message sent successfully. SID: ${twilioMessage.sid}`);

    return {
      success: true,
      sid: twilioMessage.sid,
    };
  } catch (error) {
    console.error('[WhatsApp] Error sending template message:', error);

    // Extract error message - Twilio errors have more detail
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
      // Twilio errors often have a code property
      const twilioError = error as Error & { code?: number; moreInfo?: string };
      if (twilioError.code) {
        errorMessage = `Twilio error ${twilioError.code}: ${error.message}`;
        console.error(`[WhatsApp] Twilio error code: ${twilioError.code}`);
        console.error(`[WhatsApp] More info: ${twilioError.moreInfo || 'N/A'}`);
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send WhatsApp messages to multiple recipients
 * Returns array of results for each recipient
 */
export async function sendBulkWhatsAppMessages(
  recipients: Array<{ id: string; name: string; phoneNumber: string | null }>,
  messageGenerator: (recipient: { id: string; name: string }) => string
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  for (const recipient of recipients) {
    // Skip if no valid phone number
    if (!isValidPhoneNumber(recipient.phoneNumber)) {
      results.push({
        userId: recipient.id,
        userName: recipient.name,
        phoneNumber: recipient.phoneNumber,
        status: 'skipped',
        reason: 'No valid phone number',
      });
      continue;
    }

    // Generate message for this recipient
    const message = messageGenerator(recipient);

    // Send message
    const result = await sendWhatsAppMessage(recipient.phoneNumber!, message);

    results.push({
      userId: recipient.id,
      userName: recipient.name,
      phoneNumber: recipient.phoneNumber,
      status: result.success ? 'sent' : 'failed',
      reason: result.error,
      twilioSid: result.sid,
    });

    // Add small delay between messages to avoid rate limiting
    if (recipients.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}
