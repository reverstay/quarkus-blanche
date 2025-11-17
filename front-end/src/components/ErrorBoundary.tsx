// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from "react";

export class ErrorBoundary extends Component<{children: ReactNode},{error?: Error}> {
  state = { error: undefined as Error | undefined };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding:16}}>
          <h3>Algo deu errado</h3>
          <pre>{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
