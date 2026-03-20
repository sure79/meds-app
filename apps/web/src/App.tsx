import React, { useEffect, Component, type ErrorInfo, type ReactNode } from 'react';
import { useProjectStore } from './stores/projectStore';
import Layout from './components/common/Layout';
import WelcomePage from './components/common/WelcomePage';
import HelpPage from './components/common/HelpPage';
import LoadBalancePage from './components/load-balance/LoadBalancePage';
import DiagramPage from './components/diagram/DiagramPage';
import ShortCircuitPage from './components/short-circuit/ShortCircuitPage';
import VoltageDropPage from './components/voltage-drop/VoltageDropPage';
import ProtectionPage from './components/protection/ProtectionPage';
import ClassSubmitPage from './components/class-submit/ClassSubmitPage';
import ProjectManager from './components/common/ProjectManager';
import { initDB } from './utils/db';

// Error Boundary to catch and display errors instead of blank screen
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('MEDS Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          backgroundColor: '#0a1628',
          color: '#e5e7eb',
          minHeight: '100vh',
          fontFamily: 'monospace',
        }}>
          <h1 style={{ color: '#f44336', marginBottom: '20px' }}>MEDS - 오류 발생 (Error)</h1>
          <p style={{ color: '#ffd54f', marginBottom: '10px' }}>
            앱에서 오류가 발생했습니다. 브라우저 콘솔 (F12)에서 상세 내용을 확인하세요.
          </p>
          <pre style={{
            padding: '16px',
            backgroundColor: '#0d1f35',
            border: '1px solid #1e3a5f',
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '13px',
            color: '#ff6b35',
          }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => {
              localStorage.removeItem('meds-project');
              window.location.reload();
            }}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#4fc3f7',
              color: '#0a1628',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            초기화 및 새로고침 (Reset & Reload)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ModuleRouter() {
  const activeModule = useProjectStore((s) => s.ui.activeModule);

  switch (activeModule) {
    case 'welcome':
      return <WelcomePage />;
    case 'projects':
      return <ProjectManager />;
    case 'help':
      return <HelpPage />;
    case 'load-balance':
      return <LoadBalancePage />;
    case 'diagram':
      return <DiagramPage />;
    case 'short-circuit':
      return <ShortCircuitPage />;
    case 'voltage-drop':
      return <VoltageDropPage />;
    case 'protection':
      return <ProtectionPage />;
    case 'class-submit':
      return <ClassSubmitPage />;
    default:
      return <LoadBalancePage />;
  }
}

export default function App() {
  const { loadFromLocalStorage, saveToLocalStorage, setActiveModule } = useProjectStore();

  useEffect(() => {
    // Initialize Turso DB (no-op if env vars not set)
    initDB().catch(() => { /* ignore */ });

    loadFromLocalStorage();

    // Show welcome page on first visit
    const hasSeenWelcome = localStorage.getItem('meds-welcome-seen');
    if (!hasSeenWelcome) {
      setActiveModule('welcome');
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      saveToLocalStorage();
    }, 30000);
    return () => clearInterval(interval);
  }, [saveToLocalStorage]);

  return (
    <ErrorBoundary>
      <Layout>
        <ModuleRouter />
      </Layout>
    </ErrorBoundary>
  );
}
