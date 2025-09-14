import { useState } from 'react';

// Types for admin dashboard data
interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  created_at: string;
}

interface Booking {
  id: number;
  booking_id: string;
  service_type: string;
  service_name: string;
  total_amount_cents: number;
  booking_date: string;
  time_slot: string;
  notes?: string;
  payment_type: string;
  amount_paid_cents: number;
  payment_status: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  customer?: Customer;
  remaining_balance_cents?: number;
  remaining_balance?: number;
}

interface DashboardStats {
  totalCustomers: number;
  totalBookings: number;
  pendingPayments: number;
  totalRevenue: number;
  pendingRevenue: number;
  recentBookings: Booking[];
}

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'customers' | 'payments'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Authentication
  const handleLogin = async () => {
    if (!password.trim()) {
      setAuthError('Please enter admin password');
      return;
    }

    try {
      const token = password.trim();
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setAuthToken(token);
        setIsAuthenticated(true);
        setAuthError('');
        loadDashboardData(token);
      } else {
        const data = await response.json();
        setAuthError(data.error || 'Invalid admin credentials');
      }
    } catch (err) {
      setAuthError('Failed to authenticate. Please check your connection.');
    }
  };

  // API calls with authentication
  const apiCall = async (endpoint: string, token?: string) => {
    const authTokenToUse = token || authToken;
    const response = await fetch(`/api/admin${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${authTokenToUse}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  };

  // Load dashboard data
  const loadDashboardData = async (token?: string) => {
    setLoading(true);
    setError('');
    
    try {
      const dashStats = await apiCall('/dashboard', token);
      setDashboardData(dashStats);
    } catch (err) {
      setError(`Failed to load dashboard data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };


  // Get payment status badge color
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid_in_full': return 'bg-green-100 text-green-800 border-green-200';
      case 'deposit_paid': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unpaid': return 'bg-red-100 text-red-800 border-red-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Authentication screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
              <span className="text-2xl">🐾</span>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              TidyJacks Admin
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Business dashboard access
            </p>
          </div>
          <div className="mt-8 space-y-6">
            <div>
              <label htmlFor="password" className="sr-only">Admin Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter admin password"
              />
            </div>
            
            {authError && (
              <div className="text-red-600 text-sm text-center">{authError}</div>
            )}

            <div>
              <button
                onClick={handleLogin}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Access Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🐾</span>
              <h1 className="text-2xl font-bold text-gray-900">TidyJacks Admin</h1>
            </div>
            <button
              onClick={() => {
                setIsAuthenticated(false);
                setAuthToken('');
                setPassword('');
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'bookings', label: 'Bookings' },
              { key: 'customers', label: 'Customers' },
              { key: 'payments', label: 'Outstanding Payments' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading dashboard data...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => loadDashboardData()}
              className="mt-2 text-sm text-red-700 underline hover:text-red-900"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && dashboardData && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
                    <p className="text-3xl font-bold text-gray-900">{dashboardData.totalCustomers}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
                    <p className="text-3xl font-bold text-gray-900">{dashboardData.totalBookings}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Pending Payments</h3>
                    <p className="text-3xl font-bold text-orange-600">{dashboardData.pendingPayments}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                    <p className="text-3xl font-bold text-green-600">${dashboardData.totalRevenue.toFixed(2)}</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-sm font-medium text-gray-500">Pending Revenue</h3>
                    <p className="text-3xl font-bold text-blue-600">${dashboardData.pendingRevenue.toFixed(2)}</p>
                  </div>
                </div>

                {/* Recent Bookings */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Recent Bookings</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {dashboardData.recentBookings.map((booking) => (
                      <div key={booking.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{booking.booking_id}</p>
                            <p className="text-sm text-gray-500">{booking.service_name}</p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPaymentStatusColor(booking.payment_status)}`}>
                            {booking.payment_status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs would be implemented here */}
            {activeTab !== 'overview' && (
              <div className="text-center py-12">
                <p className="text-gray-500">Dashboard feature coming soon...</p>
                <p className="text-sm text-gray-400 mt-2">
                  {activeTab === 'bookings' && 'View and manage all customer bookings'}
                  {activeTab === 'customers' && 'Customer management and contact details'}
                  {activeTab === 'payments' && 'Track outstanding balances and payments'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;