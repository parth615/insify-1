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
// ADD /api/ before /ws/
const socket = new WebSocket(`ws://127.0.0.1:8000/api/ws/Sharad_Thakur`);
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
  if (inputText.trim()) {
    console.log("📤 Attempting to send:", inputText);

    // 1. Create the message object
    const newMessage = { sender: 'Sharad_Thakur', text: inputText };

    // 2. FORCE it into the UI immediately (The Pink Box will vanish now!)
    setMessages((prev) => [...prev, newMessage]);

    // 3. Try to send to server
    if (ws && ws.readyState === WebSocket.OPEN) {
      const payload = {
        receiver: contact || "Priya",
        message: inputText
      };
      ws.send(JSON.stringify(payload));
      console.log("✅ Sent to server successfully");
    } else {
      console.log("⚠️ WebSocket not open. State:", ws?.readyState);
    }

    // 4. Reset & Scroll
    setInputText('');
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
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
      {/* --- HEADER SECTION --- */}
<View style={styles.header}>
  <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
    <Text style={styles.backText}>← back</Text>
  </TouchableOpacity>

  <View style={styles.userInfo}>
    <Text style={styles.userName}>{contact || "PRIYA"}</Text>
    <Text style={styles.userStatus}>VIBE MATCH CHAT</Text>
  </View>

  <View style={styles.headerIcons}>
    {/* Video Call Button (Pink) */}
    <TouchableOpacity 
      onPress={() => router.push(`/video-call?channel=chat_${contact}`)} 
      style={styles.videoBtn}
    >
      <Text>📹</Text>
    </TouchableOpacity>

    {/* 📞 PHONE BUTTON (Green) - ADD THE CODE HERE */}
    <TouchableOpacity 
      style={styles.phoneBtn} 
      onPress={() => router.push({
        pathname: '/video-call',
        params: { channel: `voice_${contact}`, mode: 'audio' }
      })}
    >
      <Text>📞</Text>
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
     {/* INPUT BAR */}
<View style={styles.inputBar}>
  
  {/* MUSIC BUTTON: Shares a song/artist */}
  <TouchableOpacity 
    style={styles.extraIcon} 
    onPress={() => setInputText("🎧 Currently vibing to: ")}
  >
    <Text style={{fontSize: 20}}>🎵</Text>
  </TouchableOpacity>

  {/* STAR BUTTON: Quick Match Compliment */}
  <TouchableOpacity 
    style={styles.extraIcon} 
    onPress={() => setInputText("✨ Our vibe score is insane! ")}
  >
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
  // --- LAYOUT ---
  container: { flex: 1, backgroundColor: '#FF007F' },
  
  // --- HEADER ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 15,
    backgroundColor: '#000',
  },
  // --- CHAT AREA & SCROLLING ---
  chatArea: {
    flex: 1,
    paddingHorizontal: 10,
  },
  scrollStyle: {
    paddingBottom: 20,
  },

  // --- EMPTY STATE (The Pink Box with the Music Icon) ---
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '20%',
  },
  musicIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#CCFF00', // Lime circle
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#000',
    marginBottom: 20,
  },
  emptyText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  emptySub: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginTop: 10,
    fontWeight: '800',
    fontSize: 14,
    borderWidth: 2,
    borderColor: '#000',
  },
  backBtn: { backgroundColor: '#00FFFF', padding: 8, borderWidth: 2, borderColor: '#000' },
  backText: { fontWeight: '900', fontSize: 12 },
  userInfo: { alignItems: 'center' },
  userName: { color: '#CCFF00', fontWeight: '900', fontSize: 18 },
  userStatus: { color: '#fff', fontSize: 10 },
  headerIcons: { flexDirection: 'row', gap: 10 },
  videoBtn: { backgroundColor: '#FFB6C1', padding: 8, borderWidth: 2, borderColor: '#fff' },
  phoneBtn: { backgroundColor: '#90EE90', padding: 8, borderWidth: 2, borderColor: '#fff' },

  // --- CHAT BUBBLES (Fixes the first 4 errors) ---
  bubble: {
    padding: 12,
    marginVertical: 5,
    maxWidth: '80%',
    borderWidth: 3,
    borderColor: '#000',
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#CCFF00', // Lime for Sharad
  },
  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff', // White for Priya
  },
  bubbleText: {
    fontWeight: '800',
    color: '#000',
    fontSize: 16,
  },

  // --- INPUT BAR (Fixes the last 5 errors) ---
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 4,
    borderColor: '#000',
  },
  extraIcon: { // Note: Match the casing 'extraIcon' used in your code
    padding: 10,
    borderWidth: 2,
    borderColor: '#000',
    marginRight: 5,
    backgroundColor: '#CCFF00',
  },
  input: {
    flex: 1,
    height: 45,
    borderWidth: 3,
    borderColor: '#000',
    paddingHorizontal: 15,
    fontWeight: '700',
    fontSize: 16,
  },
  sendBtn: {
    backgroundColor: '#FF007F',
    width: 50,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
    marginLeft: 5,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20,
  },
});