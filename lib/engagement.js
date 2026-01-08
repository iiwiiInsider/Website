/**
 * Customer Engagement Tracking Library
 * Monitors user interactions, engagement metrics, and customer journey
 */

/**
 * Engagement event types
 */
export const ENGAGEMENT_EVENTS = {
  PROPERTY_VIEWED: 'property_viewed',
  PROPERTY_SAVED: 'property_saved',
  INQUIRY_SENT: 'inquiry_sent',
  LISTING_CLAIMED: 'listing_claimed',
  PROFILE_COMPLETED: 'profile_completed',
  REVIEW_LEFT: 'review_left',
  REFERRAL_SENT: 'referral_sent',
  MESSAGE_SENT: 'message_sent',
  AGENT_CONTACTED: 'agent_contacted',
  SESSION_STARTED: 'session_started'
}

/**
 * Customer segments based on engagement
 */
export const CUSTOMER_SEGMENTS = {
  INACTIVE: 'inactive',
  CASUAL: 'casual',
  ACTIVE: 'active',
  POWER_USER: 'power_user',
  VIP: 'vip'
}

/**
 * Calculate engagement score
 */
export function calculateEngagementScore(events) {
  let score = 0
  
  if (!Array.isArray(events)) return score
  
  events.forEach(event => {
    switch(event.type) {
      case ENGAGEMENT_EVENTS.PROPERTY_VIEWED:
        score += 1
        break
      case ENGAGEMENT_EVENTS.INQUIRY_SENT:
        score += 5
        break
      case ENGAGEMENT_EVENTS.LISTING_CLAIMED:
        score += 10
        break
      case ENGAGEMENT_EVENTS.REVIEW_LEFT:
        score += 8
        break
      case ENGAGEMENT_EVENTS.PROFILE_COMPLETED:
        score += 15
        break
      case ENGAGEMENT_EVENTS.MESSAGE_SENT:
        score += 3
        break
      default:
        score += 2
    }
  })
  
  return score
}

/**
 * Determine customer segment
 */
export function determineSegment(engagementScore, transactionCount) {
  if (transactionCount >= 10 && engagementScore >= 100) return CUSTOMER_SEGMENTS.VIP
  if (transactionCount >= 5 && engagementScore >= 50) return CUSTOMER_SEGMENTS.POWER_USER
  if (engagementScore >= 30) return CUSTOMER_SEGMENTS.ACTIVE
  if (engagementScore >= 10) return CUSTOMER_SEGMENTS.CASUAL
  return CUSTOMER_SEGMENTS.INACTIVE
}

/**
 * Calculate customer lifetime value
 */
export function calculateLifetimeValue(transactionCount, avgTransactionValue) {
  return transactionCount * avgTransactionValue
}
