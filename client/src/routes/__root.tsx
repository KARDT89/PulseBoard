import * as React from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from '@/components/ui/sonner';
import { Navbar } from '@/components/Navbar';

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <React.Fragment>
      <Navbar/>
      <Outlet />
      <Toaster richColors position='top-right'/>
      <TanStackRouterDevtools />
    </React.Fragment>
  )
}
