// Removed react-router-dom import since we're using anchor links
import { Logo } from '@/components/common/logo'
import { Menu, X, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import React from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/AuthContext'


export const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const { user, login, logout } = useAuth()

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = () => {
    logout()
  }

  return (
    <header>
      <nav data-state={menuState && 'active'} className="fixed z-20 w-full px-2">
        <div
          className={cn(
            'mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12',
            isScrolled && 'max-w-4xl rounded-2xl backdrop-blur-sm border border-transparent lg:px-5'
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <a href="/" aria-label="home" className="flex items-center space-x-2">
                <Logo />
              </a>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className={`m-auto size-6 duration-200 ${menuState ? 'rotate-180 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
                <X className={`absolute inset-0 m-auto size-6 duration-200 ${menuState ? 'rotate-0 scale-100 opacity-100' : '-rotate-180 scale-0 opacity-0'}`} />
              </button>
            </div>


            <div className={`absolute top-full right-0 mt-2 bg-black/90 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/50 w-auto min-w-[120px] lg:relative lg:top-0 lg:right-auto lg:mt-0 lg:bg-transparent lg:border-transparent lg:shadow-none lg:p-0 lg:rounded-none ${menuState ? 'block' : 'hidden'} lg:block lg:flex lg:w-fit lg:gap-6 lg:items-center`}>
              <div className="lg:hidden">
                {!user ? (
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); login(); }}
                    className="text-white/70 hover:text-white cursor-pointer duration-150"
                  >
                    Sign In
                  </a>
                ) : (
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); handleSignOut(); }}
                    className="text-white/70 hover:text-white cursor-pointer duration-150 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </a>
                )}
              </div>

              <div className="hidden lg:flex lg:w-fit lg:gap-6 lg:items-center">
                {!user ? (
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); login(); }}
                    className="text-white/70 hover:text-white cursor-pointer duration-150"
                  >
                    Sign In
                  </a>
                ) : (
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); handleSignOut(); }}
                    className="text-white/70 hover:text-white cursor-pointer duration-150 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </a>
                )}

                <Button asChild size="sm" className={cn(isScrolled ? 'lg:inline-flex' : 'hidden')}>
                  <a href="#features">
                    <span>Try Reactify</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
