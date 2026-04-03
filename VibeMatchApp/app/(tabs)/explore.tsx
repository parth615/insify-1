import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, useWindowDimensions, ImageBackground } from 'react-native';
import axios from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';

const API_BASE_URL = 'http://127.0.0.1:8000';

type GenderFilter = 'All' | 'Male' | 'Female' | 'Other';

export default function ExploreScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('All');
  const [errorMsg, setErrorMsg] = useState('');
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const router = useRouter();

  // Continuous wiggling animation for sticker elements
  const rotation = useSharedValue(-2);
  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(2, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(-2, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStickerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const fetchMatches = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('loggedInUser');
      if (!storedUser) {
        router.replace('/');
        return;
      }
      setCurrentUser(storedUser);

      const url = new URL(`${API_BASE_URL}/matches`);
      url.searchParams.append('user_name', storedUser);
      url.searchParams.append('max_distance_km', '10');
      if (genderFilter !== 'All') {
        url.searchParams.append('gender_preference', genderFilter);
      }

      const response = await axios.get(url.toString());
      if (response.data?.data) {
        const sorted = response.data.data.sort((a: any, b: any) => b.compatibility_score - a.compatibility_score);
        setMatches(sorted);
        setErrorMsg('');
      }
    } catch (err: any) {
      setErrorMsg('Could not load matches. Ensure backend is running.');
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchMatches();
    setLoading(false);
  }, [genderFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  }, [genderFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getScoreEmoji = (score: number) => {
    if (score >= 60) return '🔥';
    if (score >= 40) return '⚡';
    if (score >= 20) return '✨';
    return '🎵';
  };

  const renderFilterChips = () => {
    const filters: GenderFilter[] = ['All', 'Male', 'Female', 'Other'];
    return (
      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, genderFilter === filter && styles.filterChipActive]}
            onPress={() => setGenderFilter(filter)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, genderFilter === filter && styles.filterTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderMatchCard = ({ item, index }: { item: any; index: number }) => {
    const isEven = index % 2 === 0;
    const rotate = isEven ? '-1.5deg' : '1.5deg';
    const cardColor = isEven ? '#FFF' : '#CCFF00';

    return (
      <Animated.View entering={FadeInUp.delay(index * 80).springify()} style={[styles.card, { backgroundColor: cardColor, transform: [{rotate}] }]}>
        <View style={styles.cardTop}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{item.name.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardMeta}>{item.age} · {item.gender} · {item.distance_km ?? '<1'}km away</Text>
          </View>
          <View style={styles.scorePill}>
            <Text style={styles.scoreNum}>{getScoreEmoji(item.compatibility_score)} {item.compatibility_score}%</Text>
          </View>
        </View>

        {item.shared_artists?.length > 0 && (
          <View style={styles.chipRow}>
            {item.shared_artists.slice(0, 4).map((artist: string, i: number) => (
              <View key={i} style={[styles.chip, { transform: [{rotate: i % 2 === 0 ? '-2deg' : '3deg'}] }]}>
                <Text style={styles.chipText}>🎵 {artist}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.ideaSection}>
          <View style={styles.tapeSmall} />
          <Text style={styles.ideaLabel}>DATE IDEA</Text>
          <Text style={styles.ideaBody}>📍 {item.ai_outing_suggestion}</Text>
        </View>

        <TouchableOpacity
          style={styles.chatBtn}
          activeOpacity={0.8}
          onPress={() => {
            if (currentUser) {
              router.push({ pathname: '/chat', params: { contact: item.name, me: currentUser } });
            }
          }}
        >
          <Text style={styles.chatBtnText}>💬  START CHATTING</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ImageBackground 
        source={require('../../assets/images/wavy_bg.png')} 
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      <View style={{...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,0,127,0.3)'}} />

      <View style={styles.header}>
        <View style={styles.titleBox}>
          <Text style={styles.title}>DISCOVER</Text>
        </View>
        <Text style={styles.subtitle}>PEOPLE NEAR YOU WHO SHARE YOUR TASTE</Text>
      </View>

      {renderFilterChips()}

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : errorMsg ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryBtnText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.centerContainer}>
          <Animated.View style={[styles.stickerEmpty, animatedStickerStyle]}>
            <Text style={styles.emptyEmoji}>🎧</Text>
          </Animated.View>
          <Text style={styles.emptyTitle}>NO MATCHES YET</Text>
          <Text style={styles.emptySub}>Try changing filters or check back later</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          renderItem={renderMatchCard}
          contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#000"
              colors={['#000']}
              progressBackgroundColor="#CCFF00"
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FF007F' },
  header: { alignItems: 'center', marginTop: 10, marginBottom: 16, paddingHorizontal: 20 },
  titleBox: {
    backgroundColor: '#CCFF00', paddingHorizontal: 16, paddingVertical: 4,
    borderWidth: 6, borderColor: '#000', transform: [{rotate: '2deg'}],
    shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0,
  },
  title: { fontSize: 32, fontWeight: '900', color: '#000', letterSpacing: 2 },
  subtitle: { 
    fontSize: 14, color: '#000', marginTop: 12, fontWeight: '900', letterSpacing: 1,
    backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 3, borderColor: '#000', transform: [{rotate: '-1deg'}],
  },

  filterContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, gap: 10, paddingHorizontal: 16, flexWrap: 'wrap' },
  filterChip: {
    paddingVertical: 10, paddingHorizontal: 20,
    backgroundColor: '#FFF', borderWidth: 4, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
    transform: [{rotate: '-2deg'}],
  },
  filterChipActive: {
    backgroundColor: '#00FFFF', transform: [{rotate: '2deg'}],
  },
  filterText: { fontSize: 13, fontWeight: '900', color: '#000', textTransform: 'uppercase' },
  filterTextActive: { color: '#000' },

  listContainer: { paddingHorizontal: 16 },
  
  card: {
    borderWidth: 5, borderColor: '#000', padding: 20, marginBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 8, height: 8 }, shadowOpacity: 1, shadowRadius: 0,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF007F',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: '#000', transform: [{rotate: '-5deg'}],
  },
  avatarLetter: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  cardName: { fontSize: 24, fontWeight: '900', color: '#000', textTransform: 'uppercase', letterSpacing: 1 },
  cardMeta: { fontSize: 14, color: '#000', fontWeight: '800', marginTop: 2, letterSpacing: 0.5 },
  
  scorePill: {
    backgroundColor: '#FF007F', paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 4, borderColor: '#000', transform: [{rotate: '4deg'}],
    shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0,
  },
  scoreNum: { fontSize: 16, fontWeight: '900', color: '#FFF' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  chip: {
    backgroundColor: '#FFF', paddingVertical: 8, paddingHorizontal: 14,
    borderWidth: 3, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0,
  },
  chipText: { fontSize: 13, color: '#000', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },

  ideaSection: {
    backgroundColor: '#1DB954', padding: 16, borderWidth: 4, borderColor: '#000',
    marginBottom: 20, transform: [{rotate: '1deg'}],
  },
  tapeSmall: {
    position: 'absolute', top: -10, left: 10, width: 40, height: 20, backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2, borderColor: '#000', transform: [{rotate: '-8deg'}]
  },
  ideaLabel: {
    fontSize: 12, color: '#000', fontWeight: '900', letterSpacing: 2, marginBottom: 8,
    backgroundColor: '#FFF', paddingHorizontal: 6, paddingVertical: 4, alignSelf: 'flex-start', borderWidth: 2, borderColor: '#000',
  },
  ideaBody: { fontSize: 16, color: '#000', fontWeight: '900', lineHeight: 22 },

  chatBtn: {
    backgroundColor: '#00FFFF', paddingVertical: 18, alignItems: 'center',
    borderWidth: 5, borderColor: '#000', transform: [{rotate: '-1deg'}],
    shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0,
  },
  chatBtnText: { color: '#000', fontSize: 18, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { fontSize: 18, textAlign: 'center', marginBottom: 20, fontWeight: '900', color: '#000', backgroundColor: '#FFF', padding: 10, borderWidth: 3, borderColor: '#000' },
  retryBtn: {
    backgroundColor: '#CCFF00', paddingHorizontal: 32, paddingVertical: 16,
    borderWidth: 4, borderColor: '#000', transform: [{rotate: '-2deg'}],
    shadowColor: '#000', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0,
  },
  retryBtnText: { color: '#000', fontWeight: '900', fontSize: 16, textTransform: 'uppercase' },
  
  stickerEmpty: {
    padding: 24, backgroundColor: '#FF007F', borderWidth: 5, borderColor: '#000', borderRadius: 50,
    shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0,
    marginBottom: 20,
  },
  emptyEmoji: { fontSize: 50 },
  emptyTitle: { fontSize: 32, fontWeight: '900', color: '#FFF', marginBottom: 16, textShadowColor: '#000', textShadowOffset: {width: 4, height: 4}, textShadowRadius: 0 },
  emptySub: { fontSize: 16, color: '#000', textAlign: 'center', fontWeight: '900', lineHeight: 24, backgroundColor: '#FFF', padding: 12, borderWidth: 3, borderColor: '#000', transform: [{rotate: '-2deg'}] },
});
