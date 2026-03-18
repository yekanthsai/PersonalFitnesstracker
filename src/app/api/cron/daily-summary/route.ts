import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import webpush from 'web-push';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize web-push
webpush.setVapidDetails(
  'mailto:admin@focusfit.test',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export async function GET(request: Request) {
  // 1. Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Optionally allow if we're in development without a secret, but let's be strict
    if (process.env.NODE_ENV !== 'development' || !process.env.CRON_SECRET) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // 2. Fetch all push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (subError) throw subError;
    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'No subscriptions found' });
    }

    const today = new Date().toISOString().slice(0, 10);
    // Be careful with UTC boundaries. Supabase stores created_at in UTC.
    const startOfDay = new Date(today + "T00:00:00.000Z").toISOString();
    const endOfDay = new Date(today + "T23:59:59.999Z").toISOString();
    
    // Process each subscription
    for (const sub of subscriptions) {
      const { user_id, subscription } = sub;

      // 3. Fetch today's food logs for this user
      const { data: logs, error: logsError } = await supabase
        .from('food_logs')
        .select('name, cal, pro')
        .eq('user_id', user_id)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay);

      if (logsError) {
        console.error("Error fetching logs for user", user_id, logsError);
        continue;
      }

      if (!logs || logs.length === 0) {
        continue; // Skip if no logs today
      }

      const totalCal = logs.reduce((sum, log) => sum + (Number(log.cal) || 0), 0);
      const logDetails = logs.map(l => `${l.name} (${l.cal} kcal)`).join(', ');

      // 4. Generate summary using Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `The user ate the following today: ${logDetails}. Total calories: ${totalCal}. Generate a 1-sentence encouraging fitness summary and congratulatory remark for a daily push notification. DO NOT use markdown, emojis are okay. Keep it under 100 characters if possible.`;

      let summary = `You logged ${logs.length} meals today for a total of ${totalCal} kcal. Great job staying on track!`;
      try {
        const result = await model.generateContent(prompt);
        summary = result.response.text().trim();
      } catch (geminiError) {
        console.error("Gemini AI error:", geminiError);
      }

      // 5. Send Push Notification
      try {
        // subscription column in supabase might be string or object depending on inserted type.
        const subObject = typeof subscription === 'string' ? JSON.parse(subscription) : subscription;
        await webpush.sendNotification(
          subObject,
          JSON.stringify({
            title: "Daily Fitness Summary",
            body: summary,
            url: "/"
          })
        );
      } catch (pushError: any) {
        if (pushError.statusCode === 404 || pushError.statusCode === 410) {
          // Subscription expired or unsubscribed, remove it
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        } else {
          console.error("Web push error for user", user_id, pushError);
        }
      }
    }

    return NextResponse.json({ success: true, processed: subscriptions.length });
  } catch (error: any) {
    console.error("Cron Job Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
