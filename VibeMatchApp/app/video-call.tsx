import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function VideoCallScreen() {
  const router = useRouter();
  const { channel } = useLocalSearchParams();
  const [isClient, setIsClient] = useState(false);

  // Your Agora Project Credentials
  const APP_ID = '2c93882822514d6e8a8df60266382a48';
  const CHANNEL = (channel as string) || 'test_room';

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && Platform.OS === 'web') {
      let localTracks: any[] = [];
      let client: any = null;

      const startAgora = async () => {
        try {
          // Dynamically import the SDK
          const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
          client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

          console.log("🚀 Stage 1: Requesting Camera hardware...");
          
          // CRITICAL: Create tracks BEFORE joining. 
          // This ensures the camera light turns on even if the server connection is slow.
          localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
          console.log("✅ Stage 2: Camera tracks created. Light should be ON.");

          // Find the container we defined in the return statement
          const playerContainer = document.getElementById('video-container');
          
          if (playerContainer) {
            // Clear existing content to prevent duplicate videos
            playerContainer.innerHTML = ''; 
            
            const player = document.createElement('div');
            player.id = 'local-player';
            player.style.width = '100%';
            player.style.height = '100%';
            playerContainer.appendChild(player);

            // Play the Video Track (index 1 of the tracks array)
            localTracks[1].play('local-player');
            console.log("🎬 Stage 3: Local video playing.");
          }

          // Join the channel (using null for token as discussed)
          console.log("📡 Stage 4: Joining Agora server...");
          await client.join(APP_ID, CHANNEL, null, null);
          
          // Publish tracks so the other person can see you
          await client.publish(localTracks);
          console.log("🚀 Stage 5: Published and Live!");

        } catch (err) {
          console.error("❌ Agora Error:", err);
        }
      };

      startAgora();

      // CLEANUP: Turn off camera when the user leaves the screen
      return () => {
        localTracks.forEach(track => {
          track.stop();
          track.close();
        });
        if (client) client.leave();
        console.log("🔌 Session ended and hardware released.");
      };
    }
  }, [isClient]);

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>VIBE SESSION: {CHANNEL}</Text>
      
      {/* Note: We use both nativeID and id to ensure React Native Web 
          and the Agora DOM selector can both find this box. 
      */}
      <View 
        nativeID="video-container"
        id="video-container" 
        style={styles.videoBox} 
      />
      
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeText}>END VIBE SESSION</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FF007F', 
    justifyContent: 'center', 
    padding: 20 
  },
  headerText: {
    color: '#CCFF00',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  videoBox: { 
    width: '100%', 
    height: '70%', 
    backgroundColor: '#000', 
    borderWidth: 4, 
    borderColor: '#CCFF00',
    overflow: 'hidden'
  },
  closeBtn: {
    backgroundColor: '#000',
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#CCFF00'
  },
  closeText: { 
    color: '#CCFF00', 
    fontWeight: '900', 
    fontSize: 18 
  }
});