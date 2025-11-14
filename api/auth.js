import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { password } = req.body

  if (!password) {
    return res.status(400).json({ error: 'Password required' })
  }

  try {
    // Read passwords file from project root (server-side only)
    const passwordsPath = path.join(__dirname, '..', '.passwords')
    const passwordsContent = fs.readFileSync(passwordsPath, 'utf-8')
    const validPasswords = passwordsContent
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0)

    if (validPasswords.includes(password.trim())) {
      // Generate a simple token (for production, consider using JWT)
      const token = Buffer.from(
        Date.now().toString() + Math.random().toString()
      ).toString('base64')

      // Set HTTP-only cookie (can't be accessed via JavaScript)
      res.setHeader(
        'Set-Cookie',
        `auth_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
      )

      return res.status(200).json({ success: true })
    } else {
      return res.status(401).json({ error: 'Invalid password' })
    }
  } catch (error) {
    console.error('Auth error:', error)
    // Don't expose file system errors to client
    return res.status(500).json({ error: 'Server error' })
  }
}

