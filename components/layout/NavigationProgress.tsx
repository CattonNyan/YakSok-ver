'use client'
import { AppProgressBar as ProgressBar } from 'next-nprogress-bar'

export default function NavigationProgress() {
  return (
    <ProgressBar
      height="3px"
      color="#22c77a"
      options={{ showSpinner: false }}
      shallowRouting
    />
  )
}
