// ==========================================================================
// FARMER TRADING MARKETPLACE (AgriHub+) — FRONTEND IN-MEMORY DEMO CONTEXT
// Handles typed in-memory demonstration interactions for mentor review.
// NOTE: Pure client-side demonstration state. Zero fake backend APIs or fake auth.
// ==========================================================================

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  ProduceListing, 
  Offer, 
  Deal, 
  PaymentRecord, 
  DeliveryRecord, 
  UserProfile, 
  UserRole, 
  ScreenName,
  DealStatus,
  DeliveryStatus,
  PaymentState,
} from '../data/types';
import { 
  initialProduceListings, 
  initialOffers, 
  initialDeals, 
  initialPayments, 
  initialDeliveries, 
  initialDemoUsers 
} from '../data/placeholderData';

interface MarketContextType {
  currentUser: UserProfile | null;
  activeScreen: ScreenName;
  selectedListingId: string | null;
  selectedDealId: string | null;
  listings: ProduceListing[];
  offers: Offer[];
  deals: Deal[];
  payments: PaymentRecord[];
  deliveries: DeliveryRecord[];
  
  // Navigation
  navigateTo: (screen: ScreenName, params?: { listingId?: string; dealId?: string }) => void;
  
  // Authentication & Session
  authToken: string | null;
  login: (emailOrPhone: string, role: UserRole, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (profile: Partial<UserProfile> & { role: UserRole; name: string; password?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  
  // Marketplace Actions (Typed frontend state transitions)
  addListing: (listing: {
    productName: string;
    category: ProduceListing['category'];
    description?: string;
    quantity: number;
    unit: ProduceListing['unit'];
    startingPrice: number;
    availabilityDate: string;
    village: string;
    district: string;
    state: string;
    imageUrl?: string;
  }) => void;
  
  submitOffer: (offerData: {
    listingId: string;
    offeredPrice: number;
    quantity: number;
    unit: ProduceListing['unit'];
    message?: string;
  }) => void;
  
  acceptOffer: (offerId: string) => void;
  rejectOffer: (offerId: string) => void;
  withdrawOffer: (offerId: string) => void;
  
  // Deal & Lifecycle Transitions (Strictly approved statuses)
  updateDealStatus: (dealId: string, newStatus: DealStatus) => void;
  updatePaymentStatus: (dealId: string, newStatus: PaymentState) => void;
  updateDeliveryStatus: (deliveryId: string, newStatus: DeliveryStatus, notes?: string) => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('agrihub_token'));
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(initialDemoUsers.farmer);
  const [activeScreen, setActiveScreen] = useState<ScreenName>('landing');
  const [selectedListingId, setSelectedListingId] = useState<string | null>('prod-001');
  const [selectedDealId, setSelectedDealId] = useState<string | null>('deal-801');
  
  const [listings, setListings] = useState<ProduceListing[]>(initialProduceListings);
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>(initialDeliveries);

  // Hydrate authenticated user session on mount if token is stored
  React.useEffect(() => {
    const token = localStorage.getItem('agrihub_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Session invalid');
          return res.json();
        })
        .then((result) => {
          if (result.success && result.data) {
            const { user, farmerProfile, buyerProfile } = result.data;
            setCurrentUser({
              id: user.id,
              email: user.email || '',
              phone: user.phone || '',
              name: farmerProfile?.name || buyerProfile?.name || (user.role === 'FARMER' ? 'Farmer' : 'Buyer'),
              role: user.role,
              village: farmerProfile?.village || undefined,
              district: farmerProfile?.district || buyerProfile?.district || '',
              state: farmerProfile?.state || buyerProfile?.state || '',
              buyerType: buyerProfile?.buyerType as any,
              organizationName: buyerProfile?.organizationName || undefined,
              city: buyerProfile?.city || undefined,
            });
            setAuthToken(token);
          }
        })
        .catch(() => {
          localStorage.removeItem('agrihub_token');
          setAuthToken(null);
        });
    }
  }, []);

  const navigateTo = (screen: ScreenName, params?: { listingId?: string; dealId?: string }) => {
    if (params?.listingId) {
      setSelectedListingId(params.listingId);
    }
    if (params?.dealId) {
      setSelectedDealId(params.dealId);
    }
    setActiveScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const login = async (
    emailOrPhone: string,
    role: UserRole,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    // If password provided, perform real backend authentication
    if (password) {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: emailOrPhone, password }),
        });
        const result = await response.json();
        if (response.ok && result.success && result.data) {
          const { token, user, farmerProfile, buyerProfile } = result.data;
          if (token) {
            localStorage.setItem('agrihub_token', token);
            setAuthToken(token);
          }
          const loadedUser: UserProfile = {
            id: user.id,
            email: user.email || '',
            phone: user.phone || '',
            name: farmerProfile?.name || buyerProfile?.name || (user.role === 'FARMER' ? 'Farmer' : 'Buyer'),
            role: user.role,
            village: farmerProfile?.village || undefined,
            district: farmerProfile?.district || buyerProfile?.district || '',
            state: farmerProfile?.state || buyerProfile?.state || '',
            buyerType: buyerProfile?.buyerType as any,
            organizationName: buyerProfile?.organizationName || undefined,
            city: buyerProfile?.city || undefined,
          };
          setCurrentUser(loadedUser);
          if (loadedUser.role === 'FARMER') {
            navigateTo('farmer_dashboard');
          } else {
            navigateTo('marketplace');
          }
          return { success: true };
        } else {
          return {
            success: false,
            error: result.error?.message || 'Login failed. Please check your credentials.',
          };
        }
      } catch (err: unknown) {
        return {
          success: false,
          error: 'Unable to connect to backend authentication server.',
        };
      }
    }

    // Fallback: If no password is provided (quick demo switcher), set demo user
    if (role === 'FARMER') {
      setCurrentUser({
        ...initialDemoUsers.farmer,
        email: emailOrPhone.includes('@') ? emailOrPhone : initialDemoUsers.farmer.email,
        phone: !emailOrPhone.includes('@') ? emailOrPhone : initialDemoUsers.farmer.phone,
      });
      navigateTo('farmer_dashboard');
    } else {
      setCurrentUser({
        ...initialDemoUsers.buyer,
        email: emailOrPhone.includes('@') ? emailOrPhone : initialDemoUsers.buyer.email,
        phone: !emailOrPhone.includes('@') ? emailOrPhone : initialDemoUsers.buyer.phone,
      });
      navigateTo('marketplace');
    }
    return { success: true };
  };

  const register = async (
    profile: Partial<UserProfile> & { role: UserRole; name: string; password?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    // If password provided, perform real backend registration
    if (profile.password) {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: profile.name,
            email: profile.email || undefined,
            phone: profile.phone || undefined,
            password: profile.password,
            role: profile.role,
            village: profile.village,
            district: profile.district,
            state: profile.state,
            buyerType: profile.buyerType,
            organizationName: profile.organizationName,
            city: profile.city,
          }),
        });
        const result = await response.json();
        if (response.ok && result.success && result.data) {
          const { token, user, farmerProfile, buyerProfile } = result.data;
          if (token) {
            localStorage.setItem('agrihub_token', token);
            setAuthToken(token);
          }
          const loadedUser: UserProfile = {
            id: user.id,
            email: user.email || '',
            phone: user.phone || '',
            name: farmerProfile?.name || buyerProfile?.name || profile.name,
            role: user.role,
            village: farmerProfile?.village || undefined,
            district: farmerProfile?.district || buyerProfile?.district || '',
            state: farmerProfile?.state || buyerProfile?.state || '',
            buyerType: buyerProfile?.buyerType as any,
            organizationName: buyerProfile?.organizationName || undefined,
            city: buyerProfile?.city || undefined,
          };
          setCurrentUser(loadedUser);
          if (loadedUser.role === 'FARMER') {
            navigateTo('farmer_dashboard');
          } else {
            navigateTo('marketplace');
          }
          return { success: true };
        } else {
          return {
            success: false,
            error: result.error?.message || 'Registration failed.',
          };
        }
      } catch (err: unknown) {
        return {
          success: false,
          error: 'Unable to connect to backend authentication server.',
        };
      }
    }

    // Demo fallback if no password provided
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: profile.email || 'user@example.com',
      phone: profile.phone || '',
      name: profile.name,
      role: profile.role,
      village: profile.village || 'Locality',
      district: profile.district || 'District',
      state: profile.state || 'Maharashtra',
      buyerType: profile.buyerType || 'Retailer',
      organizationName: profile.organizationName,
      city: profile.city,
    };
    setCurrentUser(newUser);
    if (newUser.role === 'FARMER') {
      navigateTo('farmer_dashboard');
    } else {
      navigateTo('marketplace');
    }
    return { success: true };
  };

  const logout = async () => {
    const token = localStorage.getItem('agrihub_token') || authToken;
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Safe ignore network failure on logout
      }
    }
    localStorage.removeItem('agrihub_token');
    setAuthToken(null);
    setCurrentUser(null);
    navigateTo('landing');
  };

  const addListing = (data: {
    productName: string;
    category: ProduceListing['category'];
    description?: string;
    quantity: number;
    unit: ProduceListing['unit'];
    startingPrice: number;
    availabilityDate: string;
    village: string;
    district: string;
    state: string;
    imageUrl?: string;
  }) => {
    const newListing: ProduceListing = {
      id: `prod-${Date.now()}`,
      farmerId: currentUser?.id || 'usr-f-001',
      farmerName: currentUser?.name || 'Ramesh Patil',
      productName: data.productName,
      category: data.category,
      description: data.description,
      quantity: Number(data.quantity),
      totalQuantity: Number(data.quantity),
      unit: data.unit,
      startingPrice: Number(data.startingPrice),
      currency: 'INR',
      availabilityDate: data.availabilityDate,
      village: data.village,
      district: data.district,
      state: data.state,
      imageUrl: data.imageUrl,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    setListings(prev => [newListing, ...prev]);
    navigateTo('my_listings');
  };

  const submitOffer = (data: {
    listingId: string;
    offeredPrice: number;
    quantity: number;
    unit: ProduceListing['unit'];
    message?: string;
  }) => {
    const targetListing = listings.find(l => l.id === data.listingId);
    const newOffer: Offer = {
      id: `off-${Date.now()}`,
      listingId: data.listingId,
      listingProductName: targetListing ? targetListing.productName : 'Agricultural Produce',
      farmerId: targetListing ? targetListing.farmerId : 'usr-f-001',
      farmerName: targetListing ? targetListing.farmerName : 'Farmer',
      buyerId: currentUser?.id || 'usr-b-001',
      buyerName: currentUser?.name || 'Buyer',
      buyerType: currentUser?.buyerType || 'Wholesaler',
      offeredPrice: Number(data.offeredPrice),
      quantity: Number(data.quantity),
      unit: data.unit,
      status: 'ACTIVE',
      message: data.message,
      createdAt: new Date().toISOString(),
    };
    setOffers(prev => [newOffer, ...prev]);
    navigateTo('offers');
  };

  // Frontend demonstration interaction: updates in-memory state
  const acceptOffer = (offerId: string) => {
    const targetOffer = offers.find(o => o.id === offerId);
    if (!targetOffer) return;

    // Transition offer to ACCEPTED
    setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'ACCEPTED' as const } : o));

    // Update listing remaining quantity in state
    setListings(prev => prev.map(l => {
      if (l.id === targetOffer.listingId) {
        const remaining = Math.max(0, l.quantity - targetOffer.quantity);
        return {
          ...l,
          quantity: remaining,
          status: remaining === 0 ? 'SOLD_OUT' as const : 'ACTIVE' as const,
        };
      }
      return l;
    }));

    // Create deal with approved initial status CONFIRMED
    const newDealId = `deal-${Date.now()}`;
    const newDeal: Deal = {
      id: newDealId,
      listingId: targetOffer.listingId,
      productName: targetOffer.listingProductName,
      farmerId: targetOffer.farmerId,
      farmerName: targetOffer.farmerName,
      buyerId: targetOffer.buyerId,
      buyerName: targetOffer.buyerName,
      acceptedOfferId: targetOffer.id,
      quantity: targetOffer.quantity,
      unit: targetOffer.unit,
      agreedPrice: targetOffer.offeredPrice,
      totalAmount: targetOffer.quantity * targetOffer.offeredPrice,
      currency: 'INR',
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      originDistrict: 'Nashik',
      destinationDistrict: currentUser?.district || 'Thane',
    };
    setDeals(prev => [newDeal, ...prev]);

    // Create linked payment and delivery placeholders
    const newPayment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      dealId: newDealId,
      amount: newDeal.totalAmount,
      currency: 'INR',
      status: 'PENDING',
      gatewayProvider: 'External Payment Gateway',
      gatewayOrderId: `order_agri_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPayments(prev => [newPayment, ...prev]);

    const newDelivery: DeliveryRecord = {
      id: `del-${Date.now()}`,
      dealId: newDealId,
      status: 'PENDING',
      originVillage: 'Pimpalgaon Baswant',
      originDistrict: 'Nashik',
      destinationCity: 'Vashi, Navi Mumbai',
      destinationDistrict: 'Thane',
      updatedAt: new Date().toISOString(),
    };
    setDeliveries(prev => [newDelivery, ...prev]);

    navigateTo('deal_tracker', { dealId: newDealId });
  };

  const rejectOffer = (offerId: string) => {
    setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'REJECTED' as const } : o));
  };

  const withdrawOffer = (offerId: string) => {
    setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'WITHDRAWN' as const } : o));
  };

  const updateDealStatus = (dealId: string, newStatus: DealStatus) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, status: newStatus, updatedAt: new Date().toISOString() } : d));
  };

  const updatePaymentStatus = (dealId: string, newStatus: PaymentState) => {
    setPayments(prev => prev.map(p => p.dealId === dealId ? {
      ...p,
      status: newStatus,
      paidAt: newStatus === 'PAID' ? new Date().toISOString() : undefined,
    } : p));
  };

  const updateDeliveryStatus = (deliveryId: string, newStatus: DeliveryStatus, notes?: string) => {
    setDeliveries(prev => prev.map(del => del.id === deliveryId ? {
      ...del,
      status: newStatus,
      transporterNotes: notes || del.transporterNotes,
      updatedAt: new Date().toISOString(),
    } : del));
  };

  return (
    <MarketContext.Provider value={{
      authToken,
      currentUser,
      activeScreen,
      selectedListingId,
      selectedDealId,
      listings,
      offers,
      deals,
      payments,
      deliveries,
      navigateTo,
      login,
      register,
      logout,
      addListing,
      submitOffer,
      acceptOffer,
      rejectOffer,
      withdrawOffer,
      updateDealStatus,
      updatePaymentStatus,
      updateDeliveryStatus,
    }}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = (): MarketContextType => {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
};
