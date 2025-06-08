import { createAPIFileRoute } from '@tanstack/react-start/api'
import { auth } from '../lib/auth'

export const APIRoute = createAPIFileRoute('/api/auth/$')({
  GET: async ({ request }) => {
    try {
      return await auth.handler(request)
    } catch (error) {
      console.error('Auth handler error:', error)
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  },
  POST: async ({ request }) => {
    try {
      return await auth.handler(request)
    } catch (error) {
      console.error('Auth handler error:', error)
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  },
})
