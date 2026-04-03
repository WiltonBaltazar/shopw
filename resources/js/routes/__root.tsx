import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import '../../css/app.css'
import { useSeoSettings } from '~/lib/hooks'
import { generateColorScale } from '~/lib/colorScale'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  const seo = useSeoSettings()
  const themeColor = seo.theme_primary_color

  useEffect(() => {
    if (!themeColor) return
    const scale = generateColorScale(themeColor)
    const root = document.documentElement
    Object.entries(scale).forEach(([shade, hex]) => {
      root.style.setProperty(`--color-primary-${shade}`, hex)
    })
  }, [themeColor])

  return (
    <>
      {seo.favicon_url && (
        <Helmet>
          <link rel="icon" href={seo.favicon_url} />
          <link rel="shortcut icon" href={seo.favicon_url} />
          <link rel="apple-touch-icon" href={seo.favicon_url} />
        </Helmet>
      )}
      <Outlet />
    </>
  )
}
