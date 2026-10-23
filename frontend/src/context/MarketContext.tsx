// ==========================================================================
// FARMER TRADING MARKETPLACE (AgriHub+) — FRONTEND IN-MEMORY DEMO CONTEXT
// Handles typed in-memory demonstration interactions for mentor review.
// NOTE: Pure client-side demonstration state. Zero fake backend APIs or fake auth.
// ==========================================================================

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  ProduceListing, 
  Offer, 
  OfferStatus,
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
  initialPayments, 
  initialDeliveries, 
  initialDemoUsers 
} from '../data/placeholderData';
import { apiUrl } from '../config/api';

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

  // Loading & Error States
  offersLoading: boolean;
  dealsLoading: boolean;
  offersError: string | null;
  dealsError: string | null;
  
  // Navigation
  navigateTo: (screen: ScreenName, params?: { listingId?: string; dealId?: string }) => void;
  
  // Authentication & Session
  authToken: string | null;
  login: (emailOrPhone: string, role: UserRole, password?: string) => Promise<{ success: boolean; error?: string }>;
  register: (profile: Partial<UserProfile> & { role: UserRole; name: string; password?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  
  refreshListings: () => Promise<void>;
  refreshOffers: () => Promise<void>;
  refreshDeals: () => Promise<void>;

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
  }) => Promise<{ success: boolean; listingId?: string; error?: string }>;
  deleteListing: (listingId: string) => Promise<{ success: boolean; error?: string }>;
  
  submitOffer: (offerData: {
    listingId: string;
    offeredPrice: number;
    quantity: number;
    unit: ProduceListing['unit'];
    message?: string;
  }) => Promise<{ success: boolean; offerId?: string; error?: string }>;
  
  acceptOffer: (offerId: string) => Promise<{ success: boolean; dealId?: string; error?: string }>;
  rejectOffer: (offerId: string) => Promise<{ success: boolean; error?: string }>;
  withdrawOffer: (offerId: string) => Promise<{ success: boolean; error?: string }>;
  
  fetchDealById: (dealId: string) => Promise<Deal | null>;
  fetchDealStatus: (dealId: string) => Promise<{ id: string; status: DealStatus; totalAmount: number; currency: string; updatedAt: string } | null>;

  // Deal & Lifecycle Transitions (Strictly approved statuses)
  updateDealStatus: (dealId: string, newStatus: DealStatus) => void;
  updatePaymentStatus: (dealId: string, newStatus: PaymentState) => void;
  updateDeliveryStatus: (deliveryId: string, newStatus: DeliveryStatus, notes?: string) => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

function mapBackendOffer(row: any, fallbackCropName?: string): Offer {
  const rawUnit = (row.unit || 'QUINTAL').toLowerCase();
  const unit: Offer['unit'] = rawUnit === 'kg' ? 'kg' : rawUnit === 'ton' || rawUnit === 'tonne' ? 'tonne' : 'quintal';

  return {
    id: row.id,
    listingId: row.listingId,
    listingProductName: row.cropName || fallbackCropName || 'Agricultural Produce',
    farmerId: row.farmerId || '',
    farmerName: row.farmerName || 'Verified Producer',
    buyerId: row.buyerId,
    buyerName: row.buyerName || 'Buyer',
    buyerType: row.buyerType || undefined,
    offeredPrice: Number(row.offeredPrice),
    quantity: Number(row.quantity),
    unit,
    status: row.status as OfferStatus,
    message: row.message || undefined,
    expirationReason: row.expirationReason || undefined,
    createdAt: row.createdAt || new Date().toISOString(),
  };
}

function mapBackendDeal(row: any): Deal {
  const rawUnit = (row.unit || 'QUINTAL').toLowerCase();
  const unit: Deal['unit'] = rawUnit === 'kg' ? 'kg' : rawUnit === 'ton' || rawUnit === 'tonne' ? 'tonne' : 'quintal';

  return {
    id: row.id,
    listingId: row.listingId,
    productName: row.cropName || 'Agricultural Produce',
    farmerId: row.farmerId,
    farmerName: row.farmerName || 'Verified Producer',
    buyerId: row.buyerId,
    buyerName: row.buyerName || 'Buyer',
    acceptedOfferId: row.acceptedOfferId,
    quantity: Number(row.quantity),
    unit,
    agreedPrice: Number(row.agreedPrice),
    totalAmount: Number(row.totalAmount),
    currency: 'INR',
    status: row.status as DealStatus,
    createdAt: row.createdAt || new Date().toISOString(),
    updatedAt: row.updatedAt || new Date().toISOString(),
    originDistrict: row.originDistrict || 'District',
    destinationDistrict: row.destinationDistrict || 'District',
  };
}

function mapBackendListing(row: any, fallbackFarmerName?: string): ProduceListing {
  const nameLower = (row.cropName || '').toLowerCase();
  let category: ProduceListing['category'] = 'Grains';
  if (nameLower.includes('onion') || nameLower.includes('tomato') || nameLower.includes('potato') || nameLower.includes('chilli') || nameLower.includes('vegetable')) {
    category = 'Vegetables';
  } else if (nameLower.includes('chana') || nameLower.includes('tur') || nameLower.includes('moong') || nameLower.includes('dal') || nameLower.includes('pulse')) {
    category = 'Pulses';
  } else if (nameLower.includes('soy') || nameLower.includes('mustard') || nameLower.includes('groundnut') || nameLower.includes('oil')) {
    category = 'Oilseeds';
  } else if (nameLower.includes('mango') || nameLower.includes('banana') || nameLower.includes('grape') || nameLower.includes('apple') || nameLower.includes('fruit')) {
    category = 'Fruits';
  }

  const rawUnit = (row.unit || 'QUINTAL').toLowerCase();
  const unit: ProduceListing['unit'] = rawUnit === 'kg' ? 'kg' : rawUnit === 'ton' || rawUnit === 'tonne' ? 'tonne' : 'quintal';

  return {
    id: row.id,
    farmerId: row.farmerId,
    farmerName: fallbackFarmerName || 'Verified Producer',
    productName: row.cropName,
    category,
    description: row.description || undefined,
    quantity: Number(row.quantity),
    totalQuantity: Number(row.quantity),
    unit,
    startingPrice: Number(row.expectedPricePerUnit),
    currency: 'INR',
    availabilityDate: typeof row.availabilityDate === 'string' ? row.availabilityDate.split('T')[0] : String(row.availabilityDate),
    village: row.village || 'Farmgate Cluster',
    district: row.district,
    state: row.state,
    imageUrl: row.imageUrl || undefined,
    status: row.status as 'ACTIVE' | 'SOLD_OUT',
    createdAt: row.createdAt || new Date().toISOString(),
  };
}

export const MarketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('agrihub_token'));
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeScreen, setActiveScreen] = useState<ScreenName>('landing');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  
  const [listings, setListings] = useState<ProduceListing[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>(initialDeliveries);
  const [offersLoading, setOffersLoading] = useState<boolean>(false);
  const [dealsLoading, setDealsLoading] = useState<boolean>(false);
  const [offersError, setOffersError] = useState<string | null>(null);
  const [dealsError, setDealsError] = useState<string | null>(null);

  // Hydrate authenticated user session on mount if token is stored
  React.useEffect(() => {
    const token = localStorage.getItem('agrihub_token');
    if (token) {
      fetch(apiUrl('/api/auth/me'), {
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
        const response = await fetch(apiUrl('/api/auth/login'), {
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
        const response = await fetch(apiUrl('/api/auth/register'), {
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
        await fetch(apiUrl('/api/auth/logout'), {
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

  const refreshListings = React.useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/listings?limit=50'));
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const backendListings = json.data.map((item: any) => mapBackendListing(item));
        setListings(backendListings);
        if (backendListings.length > 0) {
          setSelectedListingId((prev) => (prev && backendListings.some((l: any) => l.id === prev)) ? prev : backendListings[0].id);
        }
      }
    } catch {
      // Safe fallback if server is unreachable
    }
  }, []);

  // Load real marketplace listings on mount
  React.useEffect(() => {
    refreshListings();
  }, [refreshListings]);

  const refreshOffers = React.useCallback(async () => {
    const token = localStorage.getItem('agrihub_token') || authToken;
    if (!token) return;

    setOffersLoading(true);
    setOffersError(null);
    try {
      if (currentUser?.role === 'BUYER') {
        const res = await fetch(apiUrl('/api/offers/my'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok && json.success && Array.isArray(json.data)) {
          setOffers(json.data.map((item: any) => mapBackendOffer(item)));
        } else if (!res.ok) {
          setOffersError(json.error?.message || 'Failed to fetch offers');
        }
      } else if (currentUser?.role === 'FARMER') {
        const resListings = await fetch(apiUrl('/api/listings/my'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const listingsJson = await resListings.json();
        if (resListings.ok && listingsJson.success && Array.isArray(listingsJson.data)) {
          const allOffers: Offer[] = [];
          for (const listing of listingsJson.data) {
            const offRes = await fetch(apiUrl(`/api/listings/${listing.id}/offers`), {
              headers: { Authorization: `Bearer ${token}` },
            });
            const offJson = await offRes.json();
            if (offRes.ok && offJson.success && Array.isArray(offJson.data)) {
              allOffers.push(...offJson.data.map((item: any) => mapBackendOffer(item, listing.cropName)));
            }
          }
          setOffers(allOffers);
        }
      }
    } catch (err: unknown) {
      setOffersError(err instanceof Error ? err.message : 'Error fetching offers');
    } finally {
      setOffersLoading(false);
    }
  }, [authToken, currentUser?.role]);

  const refreshDeals = React.useCallback(async () => {
    const token = localStorage.getItem('agrihub_token') || authToken;
    if (!token) return;

    setDealsLoading(true);
    setDealsError(null);
    try {
      const res = await fetch(apiUrl('/api/deals'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        setDeals(json.data.map((item: any) => mapBackendDeal(item)));
      } else if (!res.ok) {
        setDealsError(json.error?.message || 'Failed to fetch deals');
      }
    } catch (err: unknown) {
      setDealsError(err instanceof Error ? err.message : 'Error fetching deals');
    } finally {
      setDealsLoading(false);
    }
  }, [authToken]);

  // Load user offers and deals when authenticated
  React.useEffect(() => {
    if (authToken && currentUser) {
      refreshOffers();
      refreshDeals();
    }
  }, [authToken, currentUser, refreshOffers, refreshDeals]);

  const addListing = async (data: {
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
  }): Promise<{ success: boolean; listingId?: string; error?: string }> => {
    const token = localStorage.getItem('agrihub_token') || authToken;
    if (!token) {
      return { success: false, error: 'Authentication required. Please log in as a farmer to create a listing.' };
    }

    try {
      const res = await fetch(apiUrl('/api/listings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cropName: data.productName,
          description: data.description,
          quantity: Number(data.quantity),
          unit: data.unit.toUpperCase(),
          expectedPricePerUnit: Number(data.startingPrice),
          availabilityDate: data.availabilityDate,
          village: data.village,
          district: data.district,
          state: data.state,
          imageUrl: data.imageUrl,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        const created = mapBackendListing(json.data, currentUser?.name);
        created.category = data.category;
        setListings(prev => [created, ...prev.filter(l => l.id !== created.id)]);
        navigateTo('my_listings');
        return { success: true, listingId: created.id };
      } else {
        return { success: false, error: json.error?.message || 'Failed to create produce listing.' };
      }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Network error creating produce listing.' };
    }
  };

  const deleteListing = async (listingId: string): Promise<{ success: boolean; error?: string }> => {
    const token = localStorage.getItem('agrihub_token') || authToken;
    if (!token) {
      return { success: false, error: 'Authentication required. Please log in to delete listing.' };
    }

    try {
      const res = await fetch(apiUrl(`/api/listings/${listingId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setListings(prev => prev.filter(l => l.id !== listingId));
        return { success: true };
      } else {
        return { success: false, error: json.error?.message || 'Failed to delete listing.' };
      }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Error deleting listing.' };
    }
  };


  const submitOffer = async (offerData: {
    listingId: string;
    offeredPrice: number;
    quantity: number;
    unit: ProduceListing['unit'];
    message?: string;
  }): Promise<{ success: boolean; offerId?: string; error?: string }> => {
    const token = localStorage.getItem('agrihub_token') || authToken;
    if (!token) {
      return { success: false, error: 'Authentication required. Please log in to submit an offer.' };
    }

    setOffersLoading(true);
    setOffersError(null);
    try {
      const response = await fetch(apiUrl(`/api/listings/${offerData.listingId}/offers`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          offeredPrice: Number(offerData.offeredPrice),
          quantity: Number(offerData.quantity),
          message: offerData.message?.trim() || undefined,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success && result.data) {
        const targetListing = listings.find(l => l.id === offerData.listingId);
        const mapped = mapBackendOffer({
          ...result.data,
          cropName: result.data.cropName || targetListing?.productName,
          unit: result.data.unit || offerData.unit,
          farmerId: result.data.farmerId || targetListing?.farmerId,
          farmerName: result.data.farmerName || targetListing?.farmerName,
          buyerName: result.data.buyerName || currentUser?.name,
        });

        setOffers(prev => [mapped, ...prev.filter(o => o.id !== mapped.id)]);
        return { success: true, offerId: mapped.id };
      } else {
        const errMsg = result.error?.message || 'Failed to submit offer.';
        setOffersError(errMsg);
        return { success: false, error: errMsg };
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unable to connect to offer submission service.';
      setOffersError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setOffersLoading(false);
    }
  };

  const acceptOffer = async (offerId: string): Promise<{ success: boolean; dealId?: string; error?: string }> => {
    const token = localStorage.getItem('agrihub_token') || authToken;
    if (!token) {
      return { success: false, error: 'Authentication required. Please log in to accept an offer.' };
    }

    setDealsLoading(true);
    setDealsError(null);
    try {
      const res = await fetch(apiUrl(`/api/offers/${offerId}/accept`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (res.ok && json.success && json.data) {
        const deal = mapBackendDeal(json.data.deal);
        setDeals(prev => [deal, ...prev.filter(d => d.id !== deal.id)]);

        setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'ACCEPTED' as OfferStatus } : o));

        if (deal.listingId && json.data.remainingListingQuantity !== undefined) {
          setListings(prev => prev.map(l => {
            if (l.id === deal.listingId) {
              return {
                ...l,
                quantity: Number(json.data.remainingListingQuantity),
                status: json.data.listingStatus as 'ACTIVE' | 'SOLD_OUT',
              };
            }
            return l;
          }));
        }

        navigateTo('deal_tracker', { dealId: deal.id });
        return { success: true, dealId: deal.id };
      } else {
        const errorMsg = json.error?.message || 'Failed to accept offer.';
        setDealsError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unable to connect to accept offer service.';
      setDealsError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setDealsLoading(false);
    }
  };

  const rejectOffer = async (offerId: string): Promise<{ success: boolean; error?: string }> => {
    const token = localStorage.getItem('agrihub_token') || authToken;
    if (!token) {
      return { success: false, error: 'Authentication required. Please log in to reject an offer.' };
    }

    setOffersLoading(true);
    setOffersError(null);
    try {
      const res = await fetch(apiUrl(`/api/offers/${offerId}/reject`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'REJECTED' as OfferStatus } : o));
        return { success: true };
      } else {
        const errorMsg = json.error?.message || 'Failed to reject offer.';
        setOffersError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unable to connect to reject offer service.';
      setOffersError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setOffersLoading(false);
    }
  };

  const withdrawOffer = async (offerId: string): Promise<{ success: boolean; error?: string }> => {
    const token = localStorage.getItem('agrihub_token') || authToken;
    if (!token) {
      return { success: false, error: 'Authentication required. Please log in to withdraw an offer.' };
    }

    setOffersLoading(true);
    setOffersError(null);
    try {
      const res = await fetch(apiUrl(`/api/offers/${offerId}/withdraw`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'WITHDRAWN' as OfferStatus } : o));
        return { success: true };
      } else {
        const errorMsg = json.error?.message || 'Failed to withdraw offer.';
        setOffersError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unable to connect to withdraw offer service.';
      setOffersError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setOffersLoading(false);
    }
  };

  const fetchDealById = async (dealId: string): Promise<Deal | null> => {
    const token = localStorage.getItem('agrihub_token') || authToken;
    if (!token) {
      return deals.find(d => d.id === dealId) || null;
    }

    try {
      const res = await fetch(apiUrl(`/api/deals/${dealId}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        const deal = mapBackendDeal(json.data);
        setDeals(prev => [deal, ...prev.filter(d => d.id !== deal.id)]);
        return deal;
      }
      return deals.find(d => d.id === dealId) || null;
    } catch {
      return deals.find(d => d.id === dealId) || null;
    }
  };

  const fetchDealStatus = async (dealId: string): Promise<{ id: string; status: DealStatus; totalAmount: number; currency: string; updatedAt: string } | null> => {
    const token = localStorage.getItem('agrihub_token') || authToken;
    if (!token) {
      const deal = deals.find(d => d.id === dealId);
      return deal ? { id: deal.id, status: deal.status, totalAmount: deal.totalAmount, currency: deal.currency, updatedAt: deal.updatedAt } : null;
    }

    try {
      const res = await fetch(apiUrl(`/api/deals/${dealId}/status`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        return json.data;
      }
      return null;
    } catch {
      return null;
    }
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
      offersLoading,
      dealsLoading,
      offersError,
      dealsError,
      navigateTo,
      login,
      register,
      logout,
      refreshListings,
      refreshOffers,
      refreshDeals,
      addListing,
      deleteListing,
      submitOffer,
      acceptOffer,
      rejectOffer,
      withdrawOffer,
      fetchDealById,
      fetchDealStatus,
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
