/**
 * User Settings & Preferences Library
 * Manages user tool preferences, buying settings, and account configuration
 */

/**
 * Available user tools/roles
 */
export const USER_TOOLS = {
  BUYER: 'buyer',
  SELLER: 'seller',
  AGENT: 'agent',
  INVESTOR: 'investor'
}

/**
 * Tool descriptions for display
 */
export const TOOL_DESCRIPTIONS = {
  [USER_TOOLS.BUYER]: {
    label: 'Buyer',
    description: 'Browse and purchase items on the marketplace',
    icon: '🛍️'
  },
  [USER_TOOLS.SELLER]: {
    label: 'Seller',
    description: 'List and sell your items',
    icon: '📦'
  },
  [USER_TOOLS.AGENT]: {
    label: 'Lister',
    description: 'List items for sale and manage transactions',
    icon: '📋'
  },
  [USER_TOOLS.INVESTOR]: {
    label: 'Investor',
    description: 'Track investments and portfolio',
    icon: '📊'
  }
}

/**
 * Default user settings
 */
export function getDefaultUserSettings() {
  return {
    primaryTool: USER_TOOLS.BUYER,
    tools: [USER_TOOLS.BUYER],
    notifications: {
      priceAlerts: true,
      newListings: true,
      messages: true,
      reviews: true
    },
    preferences: {
      currency: 'ZAR',
      timeZone: 'Africa/Johannesburg',
      maxPriceRange: 10000000,
      minPriceRange: 50000,
      interestCategories: []
    },
    buyingSettings: {
      maxBidAboveAskingPrice: 0.05, // 5% max above asking
      autoOfferOnNewListings: false,
      offerExpiryDays: 7,
      fairPriceCalcMethod: 'market_average' // market_average or agent_recommended
    },
    privacy: {
      showProfile: true,
      allowContactFromAgents: true,
      allowFriendRequests: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

/**
 * Validate tool selection
 */
export function isValidTool(tool) {
  return Object.values(USER_TOOLS).includes(tool)
}

/**
 * Calculate fair price for a property
 */
export function calculateFairPrice(basePrice, method = 'market_average', marketComps = []) {
  if (method === 'market_average' && marketComps.length > 0) {
    const avgPrice = marketComps.reduce((sum, price) => sum + price, 0) / marketComps.length
    return Math.round(avgPrice)
  }
  // Default: use base price as fair price
  return Math.round(basePrice)
}

/**
 * Generate fair offer price
 */
export function generateFairOffer(listingPrice, maxMarkupPercent = 0.05) {
  const maxPrice = listingPrice * (1 + maxMarkupPercent)
  return Math.round(listingPrice + (maxPrice - listingPrice) / 2)
}
