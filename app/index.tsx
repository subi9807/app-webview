import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';

const WEBVIEW_URL = 'https://onub2b.com';

export default function HomeScreen() {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setError(nativeEvent.description || 'Failed to load page');
    setIsLoading(false);
  };

  const handleRetry = () => {
    setError(null);
    webViewRef.current?.reload();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: WEBVIEW_URL }}
        style={[styles.webView, { opacity: error ? 0.3 : 1 }]}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        userAgent={`${Platform.select({
          ios: 'onub2b-ios',
          android: 'onub2b-android',
          default: 'onub2b-web',
        })} (Mobile App)`}
        scalesPageToFit={true}
        scrollEnabled={true}
        sharedCookiesEnabled={true}
        onShouldStartLoadWithRequest={(request) => {
          const url = request.url;
          return (
            url.startsWith('http://') ||
            url.startsWith('https://') ||
            url.startsWith('mailto:') ||
            url.startsWith('tel:')
          );
        }}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={true}
        allowsInlineMediaPlayback={true}
      />

      {isLoading && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    borderBottomWidth: 1,
    borderBottomColor: '#ef5350',
    zIndex: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#c62828',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#ef5350',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
