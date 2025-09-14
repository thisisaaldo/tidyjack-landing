import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

// Load Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PaymentFormProps {
  amount: number;
  bookingData: any;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
}

interface CheckoutFormProps {
  amount: number;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
  clientSecret: string;
}

const CheckoutForm = ({ amount, onPaymentSuccess, onPaymentError, clientSecret }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking-success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onPaymentError(error.message || 'Payment failed');
      } else {
        // Payment succeeded - get the payment intent from the confirmation result
        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
        onPaymentSuccess(paymentIntent?.id || '');
      }
    } catch (err) {
      onPaymentError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Payment Details</h3>
        <p className="text-sm text-gray-600 mb-4">
          Amount: <span className="font-semibold">${amount.toFixed(2)} AUD</span>
        </p>
        <PaymentElement />
      </div>
      
      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing Payment...
          </span>
        ) : (
          `Pay $${amount.toFixed(2)} AUD`
        )}
      </button>
      
      <div className="text-xs text-gray-500 text-center">
        <p>🔒 Payments are secure and encrypted</p>
        <p>Powered by Stripe</p>
      </div>
    </form>
  );
};

export default function PaymentForm({ amount, bookingData, onPaymentSuccess, onPaymentError }: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            bookingData,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setClientSecret(data.clientSecret);
        } else {
          onPaymentError(data.error || 'Failed to initialize payment');
        }
      } catch (error) {
        onPaymentError('Failed to connect to payment service');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [amount, bookingData, onPaymentError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600">Preparing secure payment...</span>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Unable to initialize payment. Please try again.</p>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm 
        amount={amount}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentError={onPaymentError}
        clientSecret={clientSecret}
      />
    </Elements>
  );
}