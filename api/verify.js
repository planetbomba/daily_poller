export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check if auth cookie exists
  const cookies = req.headers.cookie || ''
  const hasAuthToken = cookies.includes('auth_token=')

  if (hasAuthToken) {
    return res.status(200).json({ authenticated: true })
  } else {
    return res.status(401).json({ authenticated: false })
  }
}

