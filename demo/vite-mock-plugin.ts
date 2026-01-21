import type { Plugin } from 'vite'
import { mockPortalData, mockCheckoutSession, mockCheckoutSessionWithProration, mockProductsResponse, mockUsageCheck80 } from './src/mockData'

export function mockApiPlugin(): Plugin {
  return {
    name: 'mock-api',
    configureServer(server) {
      // Handle all /sdk/* API requests
      server.middlewares.use((req, res, next) => {
        const url = req.url || ''

        // Handle CORS preflight for all /sdk routes
        if (req.method === 'OPTIONS' && url.startsWith('/sdk')) {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-BillingOS-Version')
          res.statusCode = 204
          res.end()
          return
        }

        // Mock the customer portal endpoint
        if (url === '/sdk/customer/portal' || url.startsWith('/sdk/customer/portal?')) {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify(mockPortalData))
          return
        }

        // Mock setup intent for payment methods
        if (url === '/sdk/payment-methods/setup-intent' || url.startsWith('/sdk/payment-methods/setup-intent?')) {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify({
            clientSecret: 'seti_mock_secret',
            stripePublishableKey: 'pk_test_mock',
          }))
          return
        }

        // Mock products endpoint for PricingTable
        if (url === '/sdk/products' || url.startsWith('/sdk/products?')) {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify(mockProductsResponse))
          return
        }

        // Mock usage check endpoint for UpgradeNudge
        if (url === '/sdk/usage/check' || url.startsWith('/sdk/usage/check?')) {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify(mockUsageCheck80))
          return
        }

        // Mock checkout create endpoint
        if (url === '/sdk/checkout/create' && req.method === 'POST') {
          // Read request body to check if it's an upgrade
          let body = ''
          req.on('data', (chunk) => {
            body += chunk.toString()
          })
          req.on('end', () => {
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Access-Control-Allow-Origin', '*')

            try {
              const data = JSON.parse(body)
              // If existingSubscriptionId is provided, return proration response
              if (data.existingSubscriptionId) {
                res.end(JSON.stringify(mockCheckoutSessionWithProration))
              } else {
                res.end(JSON.stringify(mockCheckoutSession))
              }
            } catch {
              res.end(JSON.stringify(mockCheckoutSession))
            }
          })
          return
        }

        // Mock checkout confirm endpoint
        if (url.startsWith('/sdk/checkout/') && url.includes('/confirm') && req.method === 'POST') {
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(JSON.stringify({
            success: true,
            subscriptionId: 'sub_new_demo123',
            status: 'active',
            message: 'Payment successful! Your subscription is now active.',
          }))
          return
        }

        // Pass through to next middleware
        next()
      })
    },
  }
}
