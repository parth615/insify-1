import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'https://insify.onrender.com';
const WS_BASE_URL = API_BASE_URL.replace('http', 'ws') + '/ws/live';

export default function LiveRoomScreen() {
  const [username, setUsername] = useState('Guest');
  const [step, setStep] = useState<'lobby' | 'host' | 'room'>('lobby');
  
  // Lobby State
  const [rooms, setRooms] = useState<any[]>([]);
  
  // Host State
  const [newRoomName, setNewRoomName] = useState('');
  
  // Room State
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [djTrackInput, setDjTrackInput] = useState('');
  const [nowPlaying, setNowPlaying] = useState('Waiting to start...');
  
  const ws = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('loggedInUser');
      if (stored) setUsername(stored);
      fetchRooms();
    })();
    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/rooms`);
      if (res.data.status === 'success') {
        setRooms(res.data.data);
      }
    } catch (e) {
      console.log('Failed to fetch rooms');
    }
  };

  const createRoom = async () => {
    if (!newRoomName) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/rooms`, {
        dj_name: username,
        room_name: newRoomName
      });
      if (res.data.status === 'success') {
        joinRoom(res.data.room);
      }
    } catch (e) {
      Alert.alert("Error", "Could not create DJ room.");
    }
  };

  const joinRoom = (room: any) => {
    setCurrentRoom(room);
    setNowPlaying(room.now_playing);
    setMessages([]);
    setStep('room');
    
    ws.current = new WebSocket(`${WS_BASE_URL}/${room.id}/${username}`);
    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'now_playing') {
          setNowPlaying(data.track);
        } else {
          setMessages((prev) => [...prev, data]);
        }
      } catch (e) {
        console.error("Invalid WS message");
      }
    };
  };

  const leaveRoom = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    setCurrentRoom(null);
    setStep('lobby');
    fetchRooms();
  };

  const sendMessage = () => {
    if (!inputText.trim() || !ws.current) return;
    ws.current.send(JSON.stringify({ type: 'chat', client_id: username, text: inputText }));
    setInputText('');
  };

  const updateNowPlaying = () => {
    if (!djTrackInput.trim() || !ws.current) return;
    ws.current.send(JSON.stringify({ type: 'now_playing', track: djTrackInput }));
    setDjTrackInput('');
  };

  const renderMessage = ({ item }: { item: any }) => {
    if (item.type === 'system') {
      return <Text style={styles.systemText}>{item.text}</Text>;
    }
    const isMe = item.client_id === username;
    return (
      <View style={[styles.msgBubble, isMe ? styles.myMsg : styles.theirMsg]}>
        {!isMe && <Text style={styles.msgSender}>{item.client_id}</Text>}
        <Text style={styles.msgText}>{item.text}</Text>
      </View>
    );
  };

  if (step === 'lobby') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.lobbyTitle}>LIVE ROOMS</Text>
        </View>
        
        <View style={styles.lobbyContent}>
          <TouchableOpacity style={styles.hostBtn} onPress={() => setStep('host')}>
            <Text style={styles.hostBtnText}>🎙️ HOST A DJ ROOM</Text>
          </TouchableOpacity>

          <Text style={styles.subtitle}>OR JOIN A LIVE ROOM:</Text>
          
          <FlatList
            data={rooms}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.roomCard} onPress={() => joinRoom(item)}>
                <View>
                  <Text style={styles.roomName}>{item.room_name}</Text>
                  <Text style={styles.roomDj}>DJ: {item.dj_name}</Text>
                </View>
                <View style={styles.joinPill}>
                  <Text style={styles.joinPillText}>JOIN ({item.listeners} 🎧)</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No live rooms right now. Be the first to start a party! 🎉</Text>
            }
          />
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchRooms}>
            <Text style={styles.refreshBtnText}>↻ REFRESH LIST</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'host') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.lobbyTitle}>START BROADCASTING</Text>
        </View>
        <View style={styles.lobbyContent}>
          <Text style={styles.label}>ROOM NAME:</Text>
          <TextInput
            style={styles.hostInput}
            placeholder="e.g. Midnight Lofi Study"
            placeholderTextColor="#666"
            value={newRoomName}
            onChangeText={setNewRoomName}
          />
          <TouchableOpacity style={styles.hostBtn} onPress={createRoom}>
            <Text style={styles.hostBtnText}>🚀 GO LIVE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.hostBtn, { backgroundColor: '#FFF' }]} onPress={() => setStep('lobby')}>
            <Text style={[styles.hostBtnText, { color: '#000' }]}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isHost = currentRoom?.dj_name === username;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <Text style={styles.djText}>DJ {currentRoom?.dj_name}</Text>
        <TouchableOpacity style={styles.leaveBtn} onPress={leaveRoom}>
          <Text style={styles.leaveBtnText}>LEAVE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.nowPlayingBox}>
        <Text style={styles.nowPlayingLabel}>NOW PLAYING</Text>
        <Text style={styles.nowPlayingTrack}>{nowPlaying}</Text>
      </View>

      {isHost && (
        <View style={styles.djControls}>
          <TextInput 
            style={styles.djInput} 
            placeholder="Update Track Name..." 
            placeholderTextColor="#666"
            value={djTrackInput}
            onChangeText={setDjTrackInput}
          />
          <TouchableOpacity style={styles.updateTrackBtn} onPress={updateNowPlaying}>
            <Text style={styles.updateTrackText}>UPDATE</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Hype up the DJ..."
          placeholderTextColor="#666"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FF007F' },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
    backgroundColor: '#CCFF00', borderBottomWidth: 4, borderBottomColor: '#000',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  lobbyTitle: { fontSize: 24, fontWeight: '900', color: '#000', textTransform: 'uppercase', letterSpacing: 2 },
  lobbyContent: { padding: 20 },
  hostBtn: {
    backgroundColor: '#000', paddingVertical: 18, alignItems: 'center',
    borderWidth: 4, borderColor: '#FFF', transform: [{rotate: '1deg'}], marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0,
  },
  hostBtnText: { color: '#00FFFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  subtitle: { fontSize: 18, fontWeight: '900', color: '#FFF', marginBottom: 16, backgroundColor: '#000', padding: 8, alignSelf: 'flex-start', transform: [{rotate: '-2deg'}] },
  
  roomCard: {
    backgroundColor: '#FFF', padding: 16, borderWidth: 4, borderColor: '#000', 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16, transform: [{rotate: '1deg'}],
    shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0,
  },
  roomName: { fontSize: 20, fontWeight: '900', color: '#000', marginBottom: 4 },
  roomDj: { fontSize: 14, fontWeight: '800', color: '#666', textTransform: 'uppercase' },
  joinPill: { backgroundColor: '#FF0000', paddingHorizontal: 12, paddingVertical: 8, borderWidth: 3, borderColor: '#000', transform: [{rotate: '-3deg'}] },
  joinPillText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  emptyText: { color: '#FFF', fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 40 },
  refreshBtn: { marginTop: 40, alignItems: 'center', padding: 12, borderWidth: 2, borderColor: '#FFF', alignSelf: 'center', transform: [{rotate: '2deg'}] },
  refreshBtnText: { color: '#FFF', fontWeight: '900' },

  label: { color: '#FFF', fontSize: 16, fontWeight: '900', marginBottom: 8 },
  hostInput: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '800', borderWidth: 4, borderColor: '#000', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, transform: [{rotate: '-1deg'}], color: '#000' },

  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF0000', paddingHorizontal: 12, paddingVertical: 6, borderWidth: 2, borderColor: '#000' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF', marginRight: 6 },
  liveText: { color: '#FFF', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  djText: { color: '#000', fontWeight: '900', fontSize: 14, textTransform: 'uppercase' },
  leaveBtn: { backgroundColor: '#000', paddingHorizontal: 10, paddingVertical: 6, borderWidth: 2, borderColor: '#FFF' },
  leaveBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900' },

  nowPlayingBox: { backgroundColor: '#000', padding: 20, borderBottomWidth: 4, borderBottomColor: '#FFF' },
  nowPlayingLabel: { color: '#00FFFF', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginVertical: 4 },
  nowPlayingTrack: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  
  djControls: { flexDirection: 'row', padding: 12, backgroundColor: '#CCFF00', borderBottomWidth: 4, borderBottomColor: '#000' },
  djInput: { flex: 1, backgroundColor: '#FFF', borderWidth: 2, borderColor: '#000', paddingHorizontal: 12, fontWeight: '800' },
  updateTrackBtn: { backgroundColor: '#FF0000', justifyContent: 'center', paddingHorizontal: 16, marginLeft: 8, borderWidth: 2, borderColor: '#000' },
  updateTrackText: { color: '#FFF', fontWeight: '900', fontSize: 12 },

  chatList: { padding: 20, flexGrow: 1, justifyContent: 'flex-end' },
  msgBubble: { padding: 12, marginVertical: 4, maxWidth: '80%', borderWidth: 2, borderColor: '#000', shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 },
  myMsg: { backgroundColor: '#CCFF00', alignSelf: 'flex-end', transform: [{rotate: '1deg'}] },
  theirMsg: { backgroundColor: '#FFF', alignSelf: 'flex-start', transform: [{rotate: '-1deg'}] },
  msgSender: { fontSize: 10, fontWeight: '900', marginBottom: 4, color: '#FF007F', textTransform: 'uppercase' },
  msgText: { fontSize: 14, fontWeight: '800', color: '#000' },
  systemText: { color: '#FFF', fontWeight: '900', fontSize: 12, textAlign: 'center', marginVertical: 8, backgroundColor: '#000', alignSelf: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  
  inputRow: { flexDirection: 'row', padding: 16, borderTopWidth: 4, borderTopColor: '#000', backgroundColor: '#00FFFF' },
  input: { flex: 1, backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, fontWeight: '800', borderWidth: 3, borderColor: '#000', color: '#000' },
  sendBtn: { backgroundColor: '#FF0000', paddingHorizontal: 20, justifyContent: 'center', marginLeft: 8, borderWidth: 3, borderColor: '#000', shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 },
  sendText: { color: '#FFF', fontSize: 20, fontWeight: '900' }
});
