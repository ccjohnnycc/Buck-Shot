import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BSButton from '../components/BSButton';

type State = { hasError: boolean; details?: string };

class AppErrorBoundaryImpl extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, details: err instanceof Error ? err.message : String(err) };
  }

  componentDidCatch(error: unknown, info: any) {
    console.error('Unhandled UI error:', error, info);
  }

  reset = () => this.setState({ hasError: false, details: undefined });

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.msg}>
            We hit an unexpected error. You can continue using the app.
          </Text>
          <BSButton label="Reload" onPress={this.reset} />
        </View>
      );
    }
    return this.props.children as any;
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { color: '#FFD700', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  msg: { color: '#fff', textAlign: 'center', marginBottom: 16 },
  details: { color: '#888', marginTop: 12, fontSize: 12, textAlign: 'center' },
});

export default function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return <AppErrorBoundaryImpl>{children}</AppErrorBoundaryImpl>;
}