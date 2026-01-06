import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  TextInput,
  View,
  Text,
  Button,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TENANT_KEY = 'tenant_name';

const App = () => {
  const [tenant, setTenant] = useState('');
  const [url, setUrl] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const webViewRef = useRef(null);

  useEffect(() => {
    const loadTenant = async () => {
      try {
        const savedTenant = await AsyncStorage.getItem(TENANT_KEY);
        if (savedTenant && savedTenant.trim()) {
          const constructedUrl = `https://${savedTenant.trim()}.olympicatechnologies.co.in`;
          setTenant(savedTenant.trim());
          setUrl(constructedUrl);
        }
      } catch (error) {
        console.error('Failed to load tenant from storage', error);
      }
    };
    loadTenant();
  }, []);

  // Confirm before exiting the app
  useEffect(() => {
    const backAction = () => {
      if (url) {
        Alert.alert(
          'Exit App',
          'Are you sure you want to exit the application?',
          [
            { text: 'Cancel', onPress: () => null, style: 'cancel' },
            { text: 'Yes', onPress: () => BackHandler.exitApp() },
          ],
          { cancelable: false }
        );
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [url]);

  const handleSubmit = async () => {
    if (tenant.trim()) {
      const constructedUrl = `https://${tenant.trim()}.olympicatechnologies.co.in`;
      setUrl(constructedUrl);
      setShowReset(false);
      setErrorMessage('');
      try {
        await AsyncStorage.setItem(TENANT_KEY, tenant.trim());
      } catch (error) {
        console.error('Failed to save tenant to storage', error);
      }
    }
  };

  const handleReset = async () => {
    try {
      await AsyncStorage.removeItem(TENANT_KEY);
      setTenant('');
      setUrl('');
      setShowReset(false);
      setErrorMessage('');
    } catch (error) {
      console.error('Failed to reset tenant', error);
    }
  };

  const handleWebViewNavigation = (navState) => {
    const currentUrl = navState.url;
    if (
      currentUrl.includes('/accounts/log-out') ||
      currentUrl.includes('/accounts/log-in')
    ) {
      setShowReset(true);
    } else {
      setShowReset(false);
    }
  };

  const handleWebViewError = () => {
    setErrorMessage('Tenant not found');
    setShowReset(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {url ? (
        <View style={{ flex: 1 }}>
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <Button title="Reset Tenant" onPress={handleReset} />
            </View>
          ) : Platform.OS === 'ios' ? (
            <WebView
              ref={webViewRef}
              source={{ uri: url }}
              startInLoadingState={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              originWhitelist={['*']}
              setSupportMultipleWindows={false}
              pullToRefreshEnabled={true} // iOS native pull to refresh
              onNavigationStateChange={handleWebViewNavigation}
              onLoad={() => setShowReset(false)}
              onError={handleWebViewError}
              onHttpError={handleWebViewError}
              onShouldStartLoadWithRequest={() => true}
              injectedJavaScriptBeforeContentLoaded={`
                (function() {
                  window.open = function(url) {
                    window.location.href = url;
                  };
                })();
              `}
            />
          ) : (
            <ScrollView
              contentContainerStyle={{ flex: 1 }}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              <WebView
                ref={webViewRef}
                source={{ uri: url }}
                startInLoadingState={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                originWhitelist={['*']}
                setSupportMultipleWindows={false}
                onNavigationStateChange={handleWebViewNavigation}
                onLoad={() => setShowReset(false)}
                onError={handleWebViewError}
                onHttpError={handleWebViewError}
                onShouldStartLoadWithRequest={() => true}
                injectedJavaScriptBeforeContentLoaded={`
                  (function() {
                    window.open = function(url) {
                      window.location.href = url;
                    };
                  })();
                `}
              />
            </ScrollView>
          )}
          {showReset && !errorMessage && (
            <View style={styles.resetButtonContainer}>
              <Button title="Reset Tenant" onPress={handleReset} />
            </View>
          )}
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.formContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Text style={styles.label}>Enter Tenant Name:</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., myschool"
            value={tenant}
            onChangeText={setTenant}
            autoCapitalize="none"
          />
          <Button title="Enter" onPress={handleSubmit} />
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  label: { fontSize: 16, marginBottom: 10 },
  input: {
    height: 50,
    borderColor: '#aaa',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  resetButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default App;
