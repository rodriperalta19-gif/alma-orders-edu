import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const next = searchParams.get('next') || '/catalog'
  const course = searchParams.get('course')
  const baseUrl = request.nextUrl.origin

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/auth?error=missing_token`)
  }

  let payload: any
  try {
    const secret = process.env.ALMA_ORDERS_SSO_SECRET
    const iss = process.env.ALMA_ORDERS_SSO_ISS || 'alma-orders'
    const aud = process.env.ALMA_ORDERS_SSO_AUD || 'alma-edu'

    if (!secret) {
      return NextResponse.redirect(`${baseUrl}/auth?error=invalid_sso`)
    }

    const secretKey = new TextEncoder().encode(secret)
    const { payload: verified } = await jwtVerify(token, secretKey, {
      issuer: iss,
      audience: aud,
      algorithms: ['HS256'],
    })
    payload = verified

    if (payload.role !== 'store') {
      return NextResponse.redirect(`${baseUrl}/auth?error=invalid_sso`)
    }
  } catch (err: any) {
    console.warn('SSO validation failed:', err.message)
    return NextResponse.redirect(`${baseUrl}/auth?error=invalid_sso`)
  }

  try {
    const email = payload.email?.toLowerCase()
    if (!email) return NextResponse.redirect(`${baseUrl}/auth?error=invalid_sso`)

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = users?.find((u: any) => u.email === email)

    if (!existingUser) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: payload.name || email.split('@')[0] }
      })
      if (createError || !newUser.user) {
        return NextResponse.redirect(`${baseUrl}/auth?error=invalid_sso`)
      }
      await supabaseAdmin.from('profiles').upsert({
        id: newUser.user.id,
        full_name: payload.name || email.split('@')[0],
        role: 'user'
      })
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })

    if (linkError || !linkData?.properties?.action_link) {
      return NextResponse.redirect(`${baseUrl}/auth?error=invalid_sso`)
    }

    const finalNext = course ? '/catalog' : next
    const confirmUrl = new URL(`${baseUrl}/auth/sso-confirm`)
    confirmUrl.searchParams.set('action_link', linkData.properties.action_link)
    confirmUrl.searchParams.set('next', finalNext)

    return NextResponse.redirect(confirmUrl.toString())

  } catch (err: any) {
    console.error('SSO error:', err.message)
    return NextResponse.redirect(`${baseUrl}/auth?error=invalid_sso`)
  }
}
