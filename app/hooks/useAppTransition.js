'use client'

import { useContext } from 'react'
import { AppTransitionContext } from '../provider/AppTransitionProvider'

export function useAppTransition() {
  const context = useContext(AppTransitionContext)

  if (!context) {
    return {
      isTransitioning: false,
      targetPath: null,
      transitionMessage: "",
      beginTransition: () => {},
      finishTransition: () => {},
      updateTransitionMessage: () => {},
    }
  }

  return context
}