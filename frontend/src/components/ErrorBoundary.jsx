import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) { 
    super(props); 
    this.state = { hasError: false, error: null, errorInfo: null }; 
  }
  
  static getDerivedStateFromError(error) { 
    return { hasError: true }; 
  }
  
  componentDidCatch(error, errorInfo) { 
    this.setState({ error, errorInfo }); 
    const stack = encodeURIComponent(errorInfo.componentStack || '');
    const msg = encodeURIComponent(error.toString());
    fetch(`http://localhost:8003/log?error=${msg}&stack=${stack}`).catch(()=>console.log('Log ping skipped'));
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', backgroundColor: '#111', height: '100vh', width: '100vw', zIndex: 9999, position: 'fixed', top: 0, left: 0 }}>
          <h2>UI Render Crashed!</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
