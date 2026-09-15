import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

interface Message {
  id: string;
  sender: 'teacher' | 'parent';
  senderName: string;
  text: string;
  time: string;
}

const MOCK_PARENTS = [
  { id: '1', name: 'Priya Sharma', child: 'Aarav Sharma', subject: 'Maths' },
  { id: '2', name: 'Rajesh Kumar', child: 'Diya Kumar', subject: 'Science' },
  { id: '3', name: 'Anita Reddy', child: 'Vivaan Reddy', subject: 'English' },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  '1': [
    { id: 'm1', sender: 'parent', senderName: 'Priya Sharma', text: 'Good morning, I wanted to discuss Aarav\'s progress in Maths.', time: '9:15 AM' },
    { id: 'm2', sender: 'teacher', senderName: 'You', text: 'Good morning! Aarav has been doing well. His last test score was 85%.', time: '9:20 AM' },
    { id: 'm3', sender: 'parent', senderName: 'Priya Sharma', text: 'That\'s great to hear! He has been studying hard.', time: '9:22 AM' },
  ],
  '2': [
    { id: 'm4', sender: 'parent', senderName: 'Rajesh Kumar', text: 'Hello, will Diya get extra classes for Science?', time: '10:00 AM' },
  ],
  '3': [],
};

export const TeacherChatView: React.FC = () => {
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim() || !selectedParent) return;
    const newMsg: Message = {
      id: `m${Date.now()}`,
      sender: 'teacher',
      senderName: 'You',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => ({
      ...prev,
      [selectedParent]: [...(prev[selectedParent] || []), newMsg],
    }));
    setInputText('');
  };

  if (selectedParent) {
    const parent = MOCK_PARENTS.find((p) => p.id === selectedParent);
    const chatMsgs = messages[selectedParent] || [];

    return (
      <View style={styles.chatContainer}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedParent(null)} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#1A1B1C" />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderName}>{parent?.name}</Text>
            <Text style={styles.chatHeaderSub}>Re: {parent?.child}</Text>
          </View>
          <MaterialCommunityIcons name="phone-outline" size={22} color="#6B6B6B" />
        </View>

        <ScrollView style={styles.chatBody} contentContainerStyle={styles.chatBodyContent}>
          {chatMsgs.length === 0 ? (
            <View style={styles.chatEmpty}>
              <MaterialCommunityIcons name="message-outline" size={40} color="#E8E5DC" />
              <Text style={styles.chatEmptyText}>No messages yet. Say hello!</Text>
            </View>
          ) : (
            chatMsgs.map((msg) => (
              <View
                key={msg.id}
                style={[styles.msgBubble, msg.sender === 'teacher' ? styles.msgRight : styles.msgLeft]}
              >
                {msg.sender === 'parent' && <Text style={styles.msgSender}>{msg.senderName}</Text>}
                <Text style={[styles.msgText, msg.sender === 'teacher' && { color: '#FFFFFF' }]}>{msg.text}</Text>
                <Text style={[styles.msgTime, msg.sender === 'teacher' && { color: 'rgba(255,255,255,0.7)' }]}>{msg.time}</Text>
              </View>
            ))
          )}
        </ScrollView>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.8}>
              <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Parent Chat</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{MOCK_PARENTS.length}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {MOCK_PARENTS.map((parent) => {
          const lastMsg = messages[parent.id]?.slice(-1)[0];
          return (
            <TouchableOpacity
              key={parent.id}
              style={styles.contactCard}
              onPress={() => setSelectedParent(parent.id)}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <MaterialCommunityIcons name="account" size={22} color="#1A1B1C" />
              </View>
              <View style={styles.contactInfo}>
                <View style={styles.contactTop}>
                  <Text style={styles.contactName}>{parent.name}</Text>
                  {lastMsg && <Text style={styles.contactTime}>{lastMsg.time}</Text>}
                </View>
                <Text style={styles.contactChild}>Parent of {parent.child}</Text>
                {lastMsg ? (
                  <Text style={styles.contactPreview} numberOfLines={1}>{lastMsg.text}</Text>
                ) : (
                  <Text style={styles.contactPreview}>Start a conversation</Text>
                )}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#D0D0D0" />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFEFE' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  title: { fontSize: 18, fontFamily: FontFamily.extrabold, color: '#171717' },
  countBadge: {
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#D4A418' },
  list: { paddingHorizontal: 20, paddingBottom: 20, gap: 8 },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: { flex: 1, gap: 2 },
  contactTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contactName: { fontSize: 14, fontFamily: FontFamily.bold, color: '#171717' },
  contactTime: { fontSize: 10, fontFamily: FontFamily.regular, color: '#9CA3AF' },
  contactChild: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B6B6B' },
  contactPreview: { fontSize: 12, fontFamily: FontFamily.regular, color: '#9CA3AF', marginTop: 2 },

  chatContainer: { flex: 1, backgroundColor: '#FFFEFE' },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { fontSize: 15, fontFamily: FontFamily.bold, color: '#171717' },
  chatHeaderSub: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B6B6B' },
  chatBody: { flex: 1 },
  chatBodyContent: { padding: 16, gap: 10 },
  chatEmpty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  chatEmptyText: { fontSize: 13, fontFamily: FontFamily.regular, color: '#9CA3AF' },
  msgBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 4,
  },
  msgLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  msgRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#1A1B1C',
    borderBottomRightRadius: 4,
  },
  msgSender: { fontSize: 10, fontFamily: FontFamily.bold, color: '#F4C430', marginBottom: 2 },
  msgText: { fontSize: 13, fontFamily: FontFamily.regular, color: '#171717', lineHeight: 18 },
  msgTime: { fontSize: 9, fontFamily: FontFamily.regular, color: '#9CA3AF', alignSelf: 'flex-end', marginTop: 2 },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: BorderRadius.chip,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#171717',
    backgroundColor: '#FAFAFA',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
