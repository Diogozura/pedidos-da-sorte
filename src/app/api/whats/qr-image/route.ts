import { botGetQrImage } from '@/lib/whats-server';

export async function GET() {
  return botGetQrImage();
}
