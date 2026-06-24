import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Catches any render error so a single bad component can't blank the whole app.
// User data lives in localStorage, so it survives a reload.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Quillery crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
          <div className="text-3xl">🪶</div>
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Quillery hit an unexpected error. Your saved prompts are safe — they
            live in local storage. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Reload Quillery
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
