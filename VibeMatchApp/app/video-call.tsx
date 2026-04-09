import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function VideoCallScreen() {
  const router = useRouter();
  const { channel } = useLocalSearchParams();
  const [isClient, setIsClient] = useState(false);

  const APP_ID = '2c93882822514d6e8a8df60266382a48';
  const CHANNEL = (channel as string) || 'test_room';

  useEffect(() => {
    // 1. Tell the app we are now safely in the browser
    setIsClient(true);
  }, []);

  useEffect(() => {
    // 2. Only run Agora if we are on Web AND the component has loaded
    if (isClient && Platform.OS === 'web') {
      const startAgora = async () => {
        // Dynamically import Agora so it doesn't crash the pre-render
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

        try {
          await client.join(APP_ID, CHANNEL, null, null);
          const localTrack = await AgoraRTC.createMicrophoneAndCameraTracks();
          await client.publish(localTrack);
          
          const playerContainer = document.getElementById('video-container');
          if (playerContainer) {
            const player = document.createElement('div');
            player.id = 'local-player';
            player.style.width = '100%';
            player.style.height = '100%';
            playerContainer.appendChild(player);
            localTrack[1].play('local-player');
          }
        } catch (err) {
          console.error("Agora Error:", err);
        }
      };

      startAgora();
    }
  }, [isClient]);

  return (
    <View style={styles.container}>
      {/* 3. Use a standard View as a container for the Web Div */}
      <View 
        id="video-container" 
        style={{ width: '100%', height: '70%', backgroundColor: '#000', borderWidth: 4, borderColor: '#CCFF00' }} 
      />
      
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeText}>END VIBE SESSION</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FF007F', justifyContent: 'center', padding: 20 },
  closeBtn: {
    backgroundColor: '#000',
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#CCFF00'
  },
  closeText: { color: '#CCFF00', fontWeight: '900', fontSize: 18 }
});