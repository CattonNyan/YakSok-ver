export {}

declare global {
  interface Window {
    PortOne?: {
      requestIdentityVerification: (request: {
        storeId: string
        channelKey: string
        identityVerificationId: string
        redirectUrl?: string
      }) => Promise<{
        code?: string
        message?: string
        identityVerificationId?: string
      }>
    }
  }
}
