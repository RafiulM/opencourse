interface SettingsHeaderProps {
  title: string
  description?: string
}

export function SettingsHeader({ title, description }: SettingsHeaderProps) {
  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
      {/* Page Header */}
      {(title || description) && (
        <div className="bg-muted/30 border-t">
          <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col space-y-2">
              {title && (
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              )}
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
