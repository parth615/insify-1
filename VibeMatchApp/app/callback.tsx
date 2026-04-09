import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function SpotifyCallback() {
  const router = useRouter();
  const { code } = useLocalSearchParams(); // Captures the ?code= from Spotify

  useEffect(() => {
    if (code) {
      console.log("✅ Spotify Auth Code received:", code);
      
      // In a full version, you'd send this code to your Python backend here
      // For now, we'll just show the success and redirect back to Explore
      const timer = setTimeout(() => {
        router.replace('/(tabs)/explore'); 
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [code]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.text}>VIBE SYNCING...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FF007F', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  card: {
    backgroundColor: '#CCFF00',
    padding: 40,
    borderWidth: 4,
    borderColor: '#000',
    alignItems: 'center',
    transform: [{ rotate: '-3deg' }]
  },
  text: { 
    color: '#000', 
    marginTop: 20, 
    fontWeight: '900', 
    fontSize: 24 
  }
});