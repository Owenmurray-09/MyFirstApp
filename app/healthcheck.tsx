import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function HealthCheckScreen() {
  const [testResult, setTestResult] = useState<string>('');

  const testSupabaseConnection = async () => {
    setTestResult('Testing...');

    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Supabase test error:', error);
        setTestResult(`❌ Error: ${error.message}`);
      } else {
        console.log('Supabase test success:', data);
        setTestResult('✅ Supabase connection working!');
      }
    } catch (err) {
      console.error('Connection test failed:', err);
      setTestResult(`❌ Connection failed: ${err}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>App Health Check</Text>
      <Text style={styles.subtitle}>✅ Expo web build is working!</Text>

      <TouchableOpacity style={styles.button} onPress={testSupabaseConnection}>
        <Text style={styles.buttonText}>Test Supabase Connection</Text>
      </TouchableOpacity>

      {testResult ? (
        <Text style={styles.testResult}>{testResult}</Text>
      ) : null}

      <Link href="/" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>← Back to Home</Text>
        </TouchableOpacity>
      </Link>

      <Text style={styles.info}>
        Route: /healthcheck{'\n'}
        Build: {new Date().toISOString()}
        {'\n'}URL: {process.env.EXPO_PUBLIC_SUPABASE_URL}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  info: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
  testResult: {
    fontSize: 16,
    color: '#333',
    marginVertical: 20,
    textAlign: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
});