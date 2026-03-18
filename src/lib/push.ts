import { supabase } from './supabase';

export async function subscribeToPush(deviceId: string) {
  if (!('serviceWorker' in navigator)) return false;
  
  const registration = await navigator.serviceWorker.ready;
  
  // Public key from env (Next.js automatically injects NEXT_PUBLIC_)
  const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicVapidKey) {
    console.error("VAPID public key not found");
    return false;
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

    // Save to Supabase
    await supabase.from('push_subscriptions').upsert({
      user_id: deviceId,
      subscription: subscription
    });
    return true;
  } catch (err) {
    console.error("Error subscribing to push:", err);
    return false;
  }
}

export async function unsubscribeFromPush(deviceId: string) {
  if (!('serviceWorker' in navigator)) return false;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }
  
  // Delete from supabase
  await supabase.from('push_subscriptions').delete().eq('user_id', deviceId);
  return true;
}

export async function getPushSubscription() {
  if (!('serviceWorker' in navigator)) return null;
  const registration = await navigator.serviceWorker.ready;
  return await registration.pushManager.getSubscription();
}

// Utility function
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
