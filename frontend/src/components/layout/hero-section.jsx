import React from 'react'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { TextEffect } from '@/components/ui/text-effect'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { HeroHeader } from './header'
import { useAuth } from '../../lib/AuthContext'
import { NewComponent } from './NewComponent'


const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: 'blur(12px)',
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        type: 'spring',
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
}

export default function HeroSection() {
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuth()

  const handleTryReactify = () => {
    if (isAuthenticated) {
      navigate('/home', { replace: true })
    } else {
      login()
    }
  }

  return (
    <>
      <HeroHeader />

      <main className="overflow-hidden">
        <section>
          <div className="relative pt-24 md:pt-36">

            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup
                  variants={{
                    container: {
                      visible: { transition: { delayChildren: 1 } },
                    },
                    item: {
                      hidden: { opacity: 0, y: 20 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { type: 'spring', bounce: 0.3, duration: 2 },
                      },
                    },
                  }}
                >
                  <a
                    href="#features"
                    className="opacity-0 hover:bg-background/20 bg-muted/20 group mx-auto flex w-fit items-center gap-4 rounded-full border border-white/10 p-1 pl-4 shadow-md shadow-black/30 transition-colors duration-300"
                  >
                    <span className="text-foreground text-sm">
                      Compile React Code Instantly in Browser
                    </span>
                    <span className="block h-4 w-0.5 border-l border-white/10 bg-white/10"></span>

                    <div className="bg-background/20 group-hover:bg-muted/30 size-6 overflow-hidden rounded-full duration-500">
                      <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                        <span className="flex size-6">
                          <ArrowRight className="m-auto size-3" />
                        </span>
                      </div>
                    </div>
                  </a>
                </AnimatedGroup>

                <TextEffect
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  as="h1"
                  className="mx-auto mt-8 max-w-4xl text-balance text-5xl max-md:font-semibold md:text-7xl lg:mt-16 xl:text-[5.25rem]"
                >
                  Reactify
                </TextEffect>

                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.5}
                  as="p"
                  className="mx-auto mt-8 max-w-2xl text-balance text-lg text-white/80"
                >
                  Compile and run React code directly in your browser with instant previews. No local
                  build setup required - just code and see results immediately.
                </TextEffect>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: { staggerChildren: 0.05, delayChildren: 0.75 },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                >
                  <div
                    key={1}
                    className="bg-white/10 rounded-[calc(var(--radius-xl)+0.125rem)] border border-white/10 p-0.5"
                  >
                    <Button onClick={handleTryReactify} size="lg" className="rounded-xl px-5 text-base">
                      <span className="text-nowrap">Try Reactify</span>
                    </Button>
                  </div>

                  <Button key={2} asChild size="lg" variant="ghost" className="h-10.5 rounded-xl px-5">
                    <a href="#solutions">
                      <span className="text-nowrap">View Solutions</span>
                    </a>
                  </Button>
                </AnimatedGroup>
              </div>
            </div>

            <AnimatedGroup
              variants={{
                container: {
                  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.75 } },
                },
                ...transitionVariants,
              }}
            >
              <div className="mask-b-from-55% relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                <div className="inset-shadow-2xs ring-white/5 bg-black/10 relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-white/10 p-4 shadow-lg shadow-black/50 ring-1 backdrop-blur-sm">
                  <video
                    className="z-2 border-white/10 aspect-[15/8] relative rounded-2xl border"
                    src="/reactify.mp4"
                    autoPlay 
                    loop
                    muted
                    playsInline
                    width="2700"
                    height="1440"
                    alt="Reactify app interface showing code compilation in browser"
                  />
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
        
        <NewComponent />
      

      </main>
    </>
  )
}
