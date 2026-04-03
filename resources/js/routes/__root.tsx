import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import '../../css/app.css'
import { useThemeColor } from '~/lib/hooks'
import { generateColorScale } from '~/lib/colorScale'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  const themeColor = useThemeColor()

  useEffect(() => {
    if (!themeColor) return
    const scale = generateColorScale(themeColor)
    const root = document.documentElement
    Object.entries(scale).forEach(([shade, hex]) => {
      root.style.setProperty(`--color-primary-${shade}`, hex)
    })
  }, [themeColor])

  return <Outlet />
}
