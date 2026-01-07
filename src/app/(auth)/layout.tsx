export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4 md:p-8">
      <div className="w-full max-w-sm md:max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">V</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">VIVE</h1>
          <p className="text-sm text-muted-foreground">
            나만의 지식 정원, VIVE에 오신 것을 환영합니다.
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
