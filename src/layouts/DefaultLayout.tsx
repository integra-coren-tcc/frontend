import { Outlet } from 'react-router-dom'

export const DefaultLayout = () => {
  return (
    <div className="min-h-screen w-full">
      <Outlet />
    </div>
  )
}
