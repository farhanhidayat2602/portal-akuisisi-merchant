export type UserRole = 'SALES' | 'ADMIN'
export type MerchantStatus = 'AVAILABLE' | 'LOCKED' | 'INTERESTED' | 'FOLLOW_UP' | 'REJECTED' | 'DO_NOT_VISIT' | 'ACQUIRED'
export type VisitResult = 'INTERESTED' | 'FOLLOW_UP' | 'REJECTED'
export type PriceRange = '$' | '$$' | '$$$'

export interface Branch {
  id: string
  code: string
  name: string
  city: string
  address?: string
  lat: number
  lng: number
  _count?: { merchants: number }
}

export interface Merchant {
  id: string
  name: string
  category: string
  address?: string
  lat: number
  lng: number
  googleRating?: number
  totalReviews?: number
  priceRange?: string
  status: MerchantStatus
  isMandiriEDC: boolean
  isMandiriQRIS: boolean
  isViralTikTok: boolean
  tiktokUrl?: string
  googleMapsUrl?: string
  photoUrl?: string
  phone?: string
  ownerName?: string
  estimatedVolume?: number
  notes?: string
  branchId: string
  branch?: Branch
  visits?: Visit[]
  lock?: MerchantLock
  lastScraped?: string
  doNotVisitUntil?: string
  createdAt: string
  updatedAt: string
}

export interface MerchantLock {
  id: string
  merchantId: string
  userId: string
  user?: { name: string; username: string }
  lockedAt: string
  expiresAt: string
}

export interface RetailContact {
  name: string
  relation: string
  phone: string
}

export interface SupplierContact {
  businessName: string
  ownerName: string
  phone: string
}

export interface EcosystemData {
  retail: RetailContact[]
  suppliers: SupplierContact[]
}

export interface Visit {
  id: string
  merchantId: string
  userId: string
  user?: { name: string; username: string }
  result: VisitResult
  notes?: string
  rejectReason?: string
  followUpDate?: string
  isHardReject: boolean
  estVolume?: number
  ecosystemData?: EcosystemData
  visitedAt: string
}

export interface User {
  id: string
  username: string
  name: string
  email: string
  role: UserRole
  branchId?: string
  branch?: Branch
  points: number
}

// Calculator types
export interface FeeCalculation {
  edcOnUsDebit: number
  edcOnUsCredit: number
  edcOffUsDebit: number
  edcOffUsCredit: number
  qrisOnUs: number
  qrisOffUs: number
}

export interface FeeResult {
  edcOnUsDebitFee: number
  edcOnUsCreditFee: number
  edcOffUsDebitFee: number
  edcOffUsCreditFee: number
  qrisFee: number
  totalEDCFee: number
  totalQRISFee: number
  totalFee: number
  monthlyProjection: number
  annualProjection: number
}

// NextAuth extension
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      branchId?: string | null
      username: string
    }
  }
  interface User {
    role: string
    branchId?: string | null
    username: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    branchId?: string | null
    userId: string
    username: string
  }
}
