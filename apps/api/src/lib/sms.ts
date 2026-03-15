export interface SmsProvider {
  send(phone: string, message: string): Promise<void>;
}

/** Development provider — logs OTP to console instead of sending SMS */
class DevSmsProvider implements SmsProvider {
  async send(phone: string, message: string): Promise<void> {
    console.log(`\n📱 [DEV SMS] To: ${phone}\n   ${message}\n`);
  }
}

/** SSL Wireless — primary Bangladesh SMS provider */
class SslWirelessProvider implements SmsProvider {
  private apiKey: string;
  private sid: string;

  constructor(apiKey: string, sid: string) {
    this.apiKey = apiKey;
    this.sid = sid;
  }

  async send(phone: string, message: string): Promise<void> {
    const params = new URLSearchParams({
      api_token: this.apiKey,
      sid: this.sid,
      msisdn: phone.replace('+', ''), // SSL Wireless expects without +
      sms: message,
      csms_id: Date.now().toString(),
    });

    const response = await fetch(
      `https://message.sslwireless.com/api/v3/send-sms?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error(`SSL Wireless API error: ${response.status}`);
    }
  }
}

export function createSmsProvider(): SmsProvider {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    return new DevSmsProvider();
  }

  const apiKey = process.env.SSL_WIRELESS_API_KEY;
  const sid = process.env.SSL_WIRELESS_SID;

  if (!apiKey || !sid) {
    console.warn('SSL Wireless credentials not set — falling back to dev SMS provider');
    return new DevSmsProvider();
  }

  return new SslWirelessProvider(apiKey, sid);
}

export function buildOtpMessage(code: string): string {
  // Bengali OTP message as specified in PRD
  return `আপনার ReviewBD যাচাই কোড: ${code}। ৫ মিনিটের মধ্যে ব্যবহার করুন।`;
}
