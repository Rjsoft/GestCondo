/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    const isDev = process.env.NODE_ENV === 'development'

    // CSP deliberadamente permissiva em script-src/style-src ('unsafe-inline'):
    // o App Router do Next.js injeta dados de hidratação em <script> inline,
    // e bibliotecas de UI (@base-ui/react, via Floating UI) posicionam popups
    // com `style` inline — sem 'unsafe-inline' a aplicação deixaria de
    // funcionar visualmente. Isto não foi possível verificar num browser real
    // nesta sessão (sem base de dados disponível), pelo que se optou pelo
    // valor mais seguro que não arrisca partir a app às cegas. Reforçar com
    // nonces por pedido (via middleware) é o passo seguinte recomendado
    // (ver SECURITY_AUDIT.md S14) — testar visualmente antes de apertar mais.
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://vitals.vercel-insights.com https://va.vercel-scripts.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

export default nextConfig
