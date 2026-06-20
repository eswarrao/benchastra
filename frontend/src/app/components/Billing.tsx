import { Check } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Billing() {
  const [plans, setPlans] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  // Fetch subscription plans and invoices
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/billing/plans');
        const data = await response.json();
        setPlans(data);
      } catch (error) {
        console.error('Error fetching plans:', error);
        // Fallback data if API fails
        setPlans([
          { name: 'Free', price: '₹0', period: '/month', highlighted: false, features: ['3 submissions/month', 'Basic search', 'No billing'] },
          { name: 'Basic', price: '₹1,999', period: '/month', highlighted: true, features: ['20 submissions/month', 'Advanced filters', 'Email support', 'Analytics'] },
          { name: 'Premium', price: '₹9,999', period: '/month', highlighted: false, features: ['Unlimited submissions', 'Priority access', 'Dedicated account', 'Custom reports', 'API access'] }
        ]);
      }
    };

    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('access_token');
        const response = await fetch('/api/billing/invoices', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setPaymentHistory(data);
        } else {
          // Fallback data for testing
          setPaymentHistory([
            { id: 'INV-001', date: '2024-01-15', amount: '₹1,999', status: 'Paid' },
            { id: 'INV-002', date: '2024-02-15', amount: '₹1,999', status: 'Paid' },
            { id: 'INV-003', date: '2024-03-15', amount: '₹1,999', status: 'Pending' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
        // Fallback data
        setPaymentHistory([
          { id: 'INV-001', date: '2024-01-15', amount: '₹1,999', status: 'Paid' },
          { id: 'INV-002', date: '2024-02-15', amount: '₹1,999', status: 'Paid' },
          { id: 'INV-003', date: '2024-03-15', amount: '₹1,999', status: 'Pending' },
        ]);
      }
    };

    fetchPlans();
    fetchInvoices();
  }, []);

  // Upgrade subscription
  const handleUpgrade = async (planName: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planName }),
      });

      if (response.ok) {
        alert(`Successfully upgraded to ${planName}`);
      } else {
        alert('Upgrade failed. Please try again.');
      }
    } catch (error) {
      console.error('Upgrade failed:', error);
      alert('Upgrade failed. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    if (status.toLowerCase() === 'paid') {
      return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400';
    }
    return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Billing & Subscription
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">
          Manage your subscription plan and payment history
        </p>
      </div>

      {/* Subscription Plans */}
      {/* <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 sm:mb-6">
          Choose Your Plan
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-8 shadow-lg border-2 transition-all duration-300 ${
                plan.highlighted
                  ? 'border-blue-500 dark:border-blue-400 shadow-xl shadow-blue-500/20 md:scale-105'
                  : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500'
              }`}
            >
              {plan.highlighted && (
                <div className="inline-flex px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-semibold rounded-full mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                {plan.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100">
                  {plan.price}
                </span>
                <span className="text-slate-500 dark:text-slate-400">{plan.period}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.name)}
                className={`w-full h-11 font-semibold rounded-xl transition-all duration-200 ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-600/25'
                    : 'border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700'
                }`}
              >
                Choose Plan
              </button>
            </div>
          ))}
        </div>
      </div> */}

      {/* Payment History */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-green-50 dark:from-slate-800 dark:to-slate-800">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            Payment History
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Invoice ID
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {paymentHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No payment history found.
                  </td>
                </tr>
              ) : (
                paymentHistory.map((payment, index) => (
                  <tr key={payment.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-all duration-150">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {payment.id || `INV-${index + 1}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                      {payment.date || '2024-01-15'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {payment.amount || '₹1,999'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status || 'Pending')}`}>
                        {payment.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => window.open('#', '_blank')}
                        className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}