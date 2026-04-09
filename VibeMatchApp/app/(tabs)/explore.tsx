import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  ImageBackground, 
  RefreshControl 
} from 'react-native';
import axios from 'axios';
import { useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// 1. Interface matches exactly what your Python backend sends
interface MatchUser {
  name: string;
  age: number;
  vibe_score: number;
  top_artists: string;
}

const SPOTIFY_CLIENT_ID = '26da15706e304db08c3b7ae991943759';
const API_BASE_URL = 'http://127.0.0.1:8000';

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export default function ExploreScreen() {
  const [matches, setMatches] = useState<MatchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const redirectUri = "http://127.0.0.1:8081/callback";

  const [request, response, promptAsync] = useAuthRequest({
    clientId: SPOTIFY_CLIENT_ID,
    scopes: ['user-top-read'],
    redirectUri: redirectUri,
  }, discovery);

  // 2. The Core Fetch Function
  const fetchMatches = async () => {
    setLoading(true);
    try {
      // We use the same name you seeded in the database
      const userName = "Sharad_Thakur"; 
      const res = await axios.get(`${API_BASE_URL}/matches?user_name=${userName}`);
      
      if (res.data.matches) {
        console.log("✅ Successfully fetched matches:", res.data.matches);
        setMatches(res.data.matches);
      }
    } catch (e) {
      console.error("❌ API Error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  // 3. Helper to clean up the artist string for the UI
  const formatArtists = (artists: string) => {
    try {
      // If it's a JSON string like ["Artist1", "Artist2"]
      const parsed = JSON.parse(artists);
      return parsed.join(', ');
    } catch {
      // If it's already a plain string
      return artists.replace(/[\[\]"]/g, ''); 
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMatches();
  };

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('../../assets/images/wavy_bg.png')} 
        style={StyleSheet.absoluteFillObject} 
      />
      
      <View style={styles.headerBox}>
        <Text style={styles.headerText}>DISCOVER</Text>
      </View>
      
      <TouchableOpacity 
        style={styles.syncBtn} 
        onPress={() => promptAsync()} 
        disabled={!request}
      >
        <Text style={styles.syncBtnText}>🎵 SYNC SPOTIFY</Text>
      </TouchableOpacity>

      {loading && !refreshing && (
        <ActivityIndicator size="large" color="#CCFF00" style={{ marginTop: 20 }} />
      )}

      <FlatList 
        data={matches} 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CCFF00" />
        }
       renderItem={({ item }) => (
  <TouchableOpacity 
    onPress={() => router.push({ 
      pathname: '/chat', 
      params: { contact: item.name } // This sends the name to the chat screen
    })}
  >
    <View style={styles.matchRow}>
       <View style={{ flex: 1 }}>
          <Text style={styles.matchName}>{item.name}, {item.age}</Text>
          <Text style={styles.artistList} numberOfLines={1}>
            Vibin' to: {formatArtists(item.top_artists)}
          </Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.matchScore}>{item.vibe_score}%</Text>
        </View>
    </View>
  </TouchableOpacity>
)}
        keyExtractor={(item, i) => i.toString()}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={
          !loading ? <Text style={styles.statusMsg}>NO MATCHES FOUND. SYNC YOUR MUSIC!</Text> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FF007F' },
  headerBox: { 
    alignSelf: 'center', 
    backgroundColor: '#CCFF00', 
    padding: 10, 
    borderWidth: 5, 
    borderColor: '#000', 
    transform: [{ rotate: '2deg' }], 
    marginTop: 60,
    zIndex: 10
  },
  headerText: { fontSize: 32, fontWeight: '900', color: '#000' },
  syncBtn: { 
    backgroundColor: '#1DB954', 
    margin: 20, 
    padding: 15, 
    borderWidth: 4, 
    borderColor: '#000', 
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  syncBtnText: { fontWeight: '900', fontSize: 18, color: '#fff' },
  statusMsg: { 
    textAlign: 'center', 
    backgroundColor: '#FFF', 
    padding: 15, 
    marginTop: 50,
    borderWidth: 3, 
    borderColor: '#000', 
    fontWeight: '900' 
  },
  matchRow: { 
    backgroundColor: '#FFF', 
    padding: 15, 
    borderWidth: 4, 
    borderColor: '#000', 
    marginBottom: 15, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  matchName: { fontWeight: '900', fontSize: 20, color: '#000' },
  artistList: { fontWeight: '600', fontSize: 12, color: '#666', marginTop: 4 },
  scoreBadge: {
    backgroundColor: '#000',
    padding: 8,
    borderRadius: 5,
  },
  matchScore: { fontWeight: '900', color: '#CCFF00', fontSize: 16 }
});