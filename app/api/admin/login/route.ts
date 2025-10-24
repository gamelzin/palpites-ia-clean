import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { password } = await req.json()
    const adminPass = process.env.ADMIN_PASS

    if (!adminPass) {
      return NextResponse.json({ ok: false, error: 'ADMIN_PASS não configurado' }, { status: 500 })
    }

    if (!password || password !== adminPass) {
      return NextResponse.json({ ok: false, error: 'Senha inválida' }, { status: 401 })
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.set('admin_auth', '1', {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  } catch {
    return NextResponse.json({ ok: false, error: 'Formato inválido' }, { status: 400 })
  }
}
