import { toast } from '@/hooks/use-toast';

const WEBHOOK_BASE = 'https://saikrishnasai1920.app.n8n.cloud/webhook';

async function callWebhook(path: string, data: Record<string, unknown>) {
  try {
    const res = await fetch(`${WEBHOOK_BASE}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Webhook ${path} failed: ${res.status}`);
    return await res.json().catch(() => ({}));
  } catch (err: any) {
    toast({ title: 'Automation Error', description: err.message, variant: 'destructive' });
    throw err;
  }
}

export const webhooks = {
  newLead: (data: Record<string, unknown>) => callWebhook('new-lead', data),
  stageChange: (data: Record<string, unknown>) => callWebhook('stage-change', data),
  startDrip: (data: Record<string, unknown>) => callWebhook('start-drip', data),
  runCampaign: (data: Record<string, unknown>) => callWebhook('run-campaign', data),
  bookAppointment: (data: Record<string, unknown>) => callWebhook('book-appointment', data),
  generateSummary: (data: Record<string, unknown>) => callWebhook('generate-summary', data),
};
