/**
 * Revenue Management Library
 * Handles commission calculations, transaction tracking, and revenue analytics
 */

// Commission rates (percentage)
export const COMMISSION_RATES = {
  AGENT_CLAIM: 2.5,    // Agent earns when claiming listing
  TRANSACTION: 2.0,    // Transaction fee
  PLATFORM_FEE: 1.5,   // Platform takes this cut
  REFERRAL: 1.0        // Referral bonus
}

/**
 * Calculate commission for a transaction
 */
export function calculateCommission(price, commissionType = 'AGENT_CLAIM') {
  const rate = COMMISSION_RATES[commissionType] || COMMISSION_RATES.AGENT_CLAIM
  return Math.round(price * (rate / 100))
}

/**
 * Calculate multiple revenue streams from a single transaction
 */
export function calculateRevenueBreakdown(price) {
  return {
    grossPrice: price,
    agentEarnings: calculateCommission(price, 'AGENT_CLAIM'),
    transactionFee: calculateCommission(price, 'TRANSACTION'),
    platformFee: calculateCommission(price, 'PLATFORM_FEE'),
    referralBonus: calculateCommission(price, 'REFERRAL'),
    totalCommissions: calculateCommission(price, 'AGENT_CLAIM') + 
                      calculateCommission(price, 'TRANSACTION') + 
                      calculateCommission(price, 'REFERRAL'),
    netToAgent: calculateCommission(price, 'AGENT_CLAIM') + 
                calculateCommission(price, 'REFERRAL')
  }
}

/**
 * Revenue stream types
 */
export const REVENUE_STREAMS = {
  AGENT_COMMISSION: 'agent_commission',
  TRANSACTION_FEE: 'transaction_fee',
  PLATFORM_FEE: 'platform_fee',
  REFERRAL_BONUS: 'referral_bonus',
  PREMIUM_LISTING: 'premium_listing',
  FEATURE_UPGRADE: 'feature_upgrade'
}

/**
 * Transaction status types
 */
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  DISPUTED: 'disputed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
}
