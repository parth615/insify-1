import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ChatScreen() {
  const router = useRouter();
  const { contact } = useLocalSearchParams(); 
  
  const [messages, setMessages] = useState<{sender: string, text: string}[]>([]);
  const [inputText, setInputText] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // 1. WEBSOCKET CONNECTION
  useEffect(() => {
    // Use 127.0.0.1 for browser. Use your Computer's IP for physical phone testing.
    const socket = new WebSocket(`ws://127.0.0.1:8000/ws/Sharad_Thakur`);

    socket.onmessage = (e) => {
      const [sender, ...msgBody] = e.data.split(': ');
      setMessages((prev) => [...prev, { sender, text: msgBody.join(': ') }]);
      
      // Auto-scroll logic
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

    setWs(socket);
    return () => socket.close();
  }, []);

  // 2. ACTIONS
  const sendMessage = () => {
    if (ws && inputText.trim()) {
      ws.send(inputText);
      setInputText('');
    }
  };

  const startCall = () => {
    router.push({
      pathname: "/video-call",
      params: { channel: `chat_${contact?.toString().replace(/\s/g, '_')}` } 
    });
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>{contact || 'PARTH KHANNA'}</Text>
          <Text style={styles.headerSub}>VIBE MATCH CHAT</Text>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={startCall} style={styles.videoBtn}>
            <Text style={styles.iconEmoji}>📹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.phoneBtn}>
            <Text style={styles.iconEmoji}>📞</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CHAT MESSAGES */}
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.chatArea}
        style={styles.scrollStyle}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.musicIconCircle}>
                <Text style={{fontSize: 40}}>🎵</Text>
            </View>
            <Text style={styles.emptyText}>NO MESSAGES</Text>
            <Text style={styles.emptySub}>Say hi or share a playlist!</Text>
          </View>
        ) : (
          messages.map((msg, index) => (
            <View key={index} style={[
              styles.bubble, 
              msg.sender === 'Sharad_Thakur' ? styles.myBubble : styles.theirBubble
            ]}>
              <Text style={styles.bubbleText}>{msg.text}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* INPUT BAR */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.extraIcon}>
          <Text style={{fontSize: 20}}>🎵</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.extraIcon}>
          <Text style={{fontSize: 20}}>✨</Text>
        </TouchableOpacity>

        <TextInput 
          style={styles.input} 
          placeholder="TYPE A MESSAGE..." 
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
        />
        
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendBtnText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FF007F' },
  header: { 
    flexDirection: 'row', 
    paddingTop: 50, 
    paddingBottom: 20, 
    paddingHorizontal: 15, 
    alignItems: 'center', 
    backgroundColor: '#000',
    borderBottomWidth: 4,
    borderColor: '#CCFF00'
  },
  backBtn: { backgroundColor: '#00FFFF', padding: 8, borderWidth: 2, borderColor: '#000' },
  backBtnText: { fontWeight: '900', color: '#000' },
  headerTitleBox: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#CCFF00', fontSize: 22, fontWeight: '900', textTransform: 'uppercase' },
  headerSub: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  headerIcons: { flexDirection: 'row', gap: 10 },
  videoBtn: { backgroundColor: '#FF80BF', padding: 8, borderWidth: 2, borderColor: '#FFF' },
  phoneBtn: { backgroundColor: '#99FF99', padding: 8, borderWidth: 2, borderColor: '#FFF' },
  iconEmoji: { fontSize: 18 },
  scrollStyle: { backgroundColor: 'transparent' },
  chatArea: { padding: 20, flexGrow: 1, justifyContent: 'flex-end' },
  emptyBox: { alignItems: 'center', marginBottom: 100 },
  musicIconCircle: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: '#CCFF00', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 4,
    marginBottom: 20
  },
  emptyText: { fontSize: 36, fontWeight: '900', color: '#FFF', textAlign: 'center' },
  emptySub: { backgroundColor: '#FFF', padding: 8, fontWeight: '800', marginTop: 10 },
  inputBar: { 
    flexDirection: 'row', 
    padding: 15, 
    backgroundColor: '#FFF', 
    borderTopWidth: 5, 
    borderColor: '#000',
    alignItems: 'center'
  },
  extraIcon: { padding: 10, marginRight: 5, backgroundColor: '#CCFF00', borderWidth: 2 },
  input: { 
    flex: 1, 
    fontSize: 18, 
    fontWeight: '800', 
    height: 50, 
    borderWidth: 3, 
    paddingHorizontal: 15,
    marginHorizontal: 5
  },
  sendBtn: { backgroundColor: '#FF007F', padding: 15, borderWidth: 3, borderColor: '#000' },
  sendBtnText: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  bubble: { padding: 15, marginBottom: 12, maxWidth: '85%', borderWidth: 4, borderColor: '#000' },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#CCFF00', transform: [{ rotate: '1deg' }] },
  theirBubble: { alignSelf: 'flex-start', backgroundColor: '#FFF', transform: [{ rotate: '-1deg' }] },
  bubbleText: { fontWeight: '800', fontSize: 16 }
});