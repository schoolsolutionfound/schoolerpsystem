import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { MaterialCommunityIcons, Feather } from './common/Icons';
import { TeacherChatSkeleton } from './skeletons/TeacherChatSkeleton';
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
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

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
          <TouchableOpacity onPress={() => setSelectedParent(null)} style={styles.backBtn} activeOpacity={0.7}>
            <Feather name="arrow-left" size={18} color="#171717" />
          </TouchableOpacity>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderName}>{parent?.name}</Text>
            <Text style={styles.chatHeaderSub}>Re: {parent?.child}</Text>
          </View>
          <TouchableOpacity style={styles.headerPhoneBtn} activeOpacity={0.7}>
            <Feather name="phone" size={16} color="#4B5563" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.chatBody} contentContainerStyle={styles.chatBodyContent}>
          {chatMsgs.length === 0 ? (
            <View style={styles.chatEmpty}>
              <MaterialCommunityIcons name="message-outline" size={38} color="#9CA3AF" />
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
              <Feather name="send" size={16} color="#171717" />
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

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000000"
            colors={['#000000']}
          />
        }
      >
        {refreshing ? (
          <TeacherChatSkeleton />
        ) : (
          MOCK_PARENTS.map((parent) => {
            const lastMsg = messages[parent.id]?.slice(-1)[0];
            return (
              <TouchableOpacity
                key={parent.id}
                style={styles.contactCard}
                onPress={() => setSelectedParent(parent.id)}
                activeOpacity={0.7}
              >
                <View style={styles.avatar}>
                  <MaterialCommunityIcons name="account" size={20} color="#1A1B1C" />
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
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  title: { fontSize: 18, fontFamily: FontFamily.extrabold, color: '#111827' },
  countBadge: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  countText: { fontSize: 11, fontFamily: FontFamily.bold, color: '#4B5563' },
  list: { padding: 16, gap: 10, paddingBottom: 40 },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: { flex: 1, gap: 2 },
  contactTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contactName: { fontSize: 14, fontFamily: FontFamily.bold, color: '#111827' },
  contactTime: { fontSize: 10.5, fontFamily: FontFamily.regular, color: '#9CA3AF' },
  contactChild: { fontSize: 11.5, fontFamily: FontFamily.medium, color: '#4B5563' },
  contactPreview: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B7280', marginTop: 1 },

  chatContainer: { flex: 1, backgroundColor: '#F9FAFB' },
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
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPhoneBtn: {
    width: 34,
    height: 34,
    borderRadius: 5,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { fontSize: 15, fontFamily: FontFamily.bold, color: '#111827' },
  chatHeaderSub: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B7280' },
  chatBody: { flex: 1 },
  chatBodyContent: { padding: 16, gap: 10 },
  chatEmpty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  chatEmptyText: { fontSize: 13, fontFamily: FontFamily.regular, color: '#9CA3AF' },
  msgBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 5,
    gap: 3,
  },
  msgLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderBottomLeftRadius: 5,
  },
  msgRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#1A1B1C',
    borderBottomRightRadius: 5,
  },
  msgSender: { fontSize: 10, fontFamily: FontFamily.bold, color: '#B45309', marginBottom: 2 },
  msgText: { fontSize: 13, fontFamily: FontFamily.regular, color: '#111827', lineHeight: 18 },
  msgTime: { fontSize: 9.5, fontFamily: FontFamily.regular, color: '#9CA3AF', alignSelf: 'flex-end', marginTop: 2 },
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
    borderColor: '#E5E7EB',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 5,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
