import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PostAccessControl } from './access-control';

interface PostErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface PostErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
  communityName?: string;
  communityId?: string;
}

export class PostErrorBoundary extends React.Component<
  PostErrorBoundaryProps,
  PostErrorBoundaryState
> {
  constructor(props: PostErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PostErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Post Error Boundary caught an error:', error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const error = this.state.error;

      // Handle visibility-based access errors
      if (error && (error as any).code === 'AUTHENTICATION_REQUIRED') {
        return <PostAccessControl type="authentication" />;
      }

      if (error && (error as any).code === 'ACCESS_DENIED') {
        return (
          <PostAccessControl
            type="community"
            communityName={this.props.communityName}
            communityId={this.props.communityId}
          />
        );
      }

      // Default error fallback
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-lg">Something went wrong</CardTitle>
        <CardDescription>
          We couldn't load this post. Please try again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {process.env.NODE_ENV === 'development' && error && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-xs font-mono text-muted-foreground">
              {error.message}
            </p>
          </div>
        )}
        <Button onClick={reset} className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </CardContent>
    </Card>
  );
}

// Hook for handling post access errors in functional components
export function usePostErrorHandler() {
  const handlePostError = (error: any, communityName?: string, communityId?: string) => {
    if (!error) return null;

    if (error.code === 'AUTHENTICATION_REQUIRED') {
      return <PostAccessControl type="authentication" />;
    }

    if (error.code === 'ACCESS_DENIED') {
      return (
        <PostAccessControl
          type="community"
          communityName={communityName}
          communityId={communityId}
        />
      );
    }

    return <DefaultErrorFallback error={error} reset={() => window.location.reload()} />;
  };

  return { handlePostError };
}