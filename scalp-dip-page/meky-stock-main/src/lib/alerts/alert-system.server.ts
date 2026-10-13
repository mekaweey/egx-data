// Alert system - logs alerts; pluggable for Telegram/Email later
import { supabaseAdmin } from '@/integrations/supabase/client.server';

export type Alert = {
  type: 'pick' | 'stop_hit' | 'target_hit' | 'circuit_breaker' | 'anomaly' | 'high_conviction';
  symbol?: string;
  message: string;
  messageAr: string;
  severity: 'info' | 'warning' | 'critical';
  metadata?: Record<string, unknown>;
};

export async function emitAlert(alert: Alert): Promise<void> {
  try {
    await supabaseAdmin.from('data_source_logs').insert({
      provider: 'alert_system',
      symbol: alert.symbol,
      ok: alert.severity !== 'critical',
      error: alert.severity === 'critical' ? alert.message : null,
      latency_ms: 0
    });
  } catch (e) {
    console.error('Alert logging failed:', e);
  }
  // Telegram/Email hooks can be added here using env secrets
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChat = process.env.TELEGRAM_CHAT_ID;
  if (telegramToken && telegramChat && alert.severity !== 'info') {
    try {
      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChat,
          text: `${alert.severity === 'critical' ? '🚨' : '⚠️'} ${alert.messageAr}`,
          parse_mode: 'HTML'
        })
      });
    } catch (e) {
      console.error('Telegram alert failed:', e);
    }
  }
}

export async function emitHighConvictionAlert(symbol: string, confidence: number, entryPrice: number, target: number): Promise<void> {
  await emitAlert({
    type: 'high_conviction',
    symbol,
    severity: 'info',
    message: `High conviction pick: ${symbol} @ ${entryPrice} → ${target} (${confidence}%)`,
    messageAr: `إشارة قوية: ${symbol} عند ${entryPrice} → ${target} (ثقة ${confidence}%)`,
    metadata: { confidence, entryPrice, target }
  });
}
