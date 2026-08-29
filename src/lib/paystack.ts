/**
 * Paystack Integration Helper for Epiqure (Dabou, Côte d'Ivoire)
 * Supports Cards (Visa, Mastercard), Mobile Money (Wave, Orange Money, MTN MoMo)
 */

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: {
        key: string;
        email: string;
        amount: number; // in sub-units (e.g. 5000 XOF -> 5000 * 100)
        currency?: string;
        ref?: string;
        channels?: string[];
        metadata?: {
          custom_fields?: Array<{
            display_name: string;
            variable_name: string;
            value: string;
          }>;
          [key: string]: any;
        };
        callback: (response: { reference: string; status: string; trans?: string; message?: string }) => void;
        onClose: () => void;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

export const PAYSTACK_PUBLIC_KEY =
  (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_fd9e7cf1b98d3510755541f6ae4366ab5b769def';

export interface PaystackCheckoutOptions {
  email: string;
  amountFCFA: number; // Amount in standard FCFA (e.g. 2000, 5000, 15000)
  planOrServiceName: string;
  customerName?: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
  onSuccess: (response: { reference: string; status: string; paidAmount: number }) => void;
  onCancel?: () => void;
  onError?: (err: Error) => void;
}

/**
 * Loads Paystack JS script dynamically if not already loaded in the document
 */
export function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.PaystackPop) {
      resolve();
      return;
    }

    const existingScript = document.querySelector('script[src*="paystack.co"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Impossible de charger le module de paiement Paystack')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Erreur lors du chargement de Paystack'));
    document.head.appendChild(script);
  });
}

/**
 * Trigger Paystack Pop inline payment modal
 */
export async function openPaystackModal(options: PaystackCheckoutOptions): Promise<void> {
  try {
    await loadPaystackScript();

    if (!window.PaystackPop) {
      throw new Error("Le module Paystack n'est pas initialisé sur votre navigateur.");
    }

    const generatedRef = `EPQ-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    // Paystack requires amount in subunits (cents/centimes): 5000 FCFA -> 500000
    const subunitAmount = Math.round(options.amountFCFA * 100);

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: options.email.trim() || 'client@epicure.ci',
      amount: subunitAmount,
      currency: 'XOF',
      ref: generatedRef,
      channels: ['card', 'mobile_money', 'bank', 'ussd', 'qr'],
      metadata: {
        custom_fields: [
          {
            display_name: 'Service / Formule',
            variable_name: 'service_name',
            value: options.planOrServiceName,
          },
          {
            display_name: 'Client',
            variable_name: 'customer_name',
            value: options.customerName || 'Adhérent Epiqure',
          },
          {
            display_name: 'Téléphone',
            variable_name: 'customer_phone',
            value: options.customerPhone || 'Non renseigné',
          },
        ],
        ...options.metadata,
      },
      callback: (response) => {
        console.log('[Paystack] Payment success:', response);
        options.onSuccess({
          reference: response.reference || generatedRef,
          status: 'success',
          paidAmount: options.amountFCFA,
        });
      },
      onClose: () => {
        console.log('[Paystack] Checkout modal closed by user');
        if (options.onCancel) {
          options.onCancel();
        }
      },
    });

    handler.openIframe();
  } catch (err: any) {
    console.error('[Paystack] Error opening checkout:', err);
    if (options.onError) {
      options.onError(err);
    } else {
      alert(`Erreur de paiement : ${err?.message || 'Problème de connexion avec Paystack'}`);
    }
  }
}
