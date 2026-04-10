import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { io } from 'socket.io-client';
import axios from 'axios';
import { API_URL, SOCKET_URL, DEFAULT_USER_ID } from '@/constants/Config';
import MealCard from '@/components/MealCard';
import { Plus, X, Utensils } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotifications } from '@/hooks/useNotifications';
import { Meal } from '@/types/meal';

export default function MealLogScreen() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [description, setDescription] = useState('');
  const { scheduleDailyReminder } = useNotifications();

  const fetchMeals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/meals?userId=${DEFAULT_USER_ID}`);
      const data: Meal[] = Array.isArray(response.data) ? response.data : [];
      setMeals(
        data.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      );
    } catch (err) {
      console.error('Failed to fetch meals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeals();
    scheduleDailyReminder();

    const socket = io(SOCKET_URL);
    socket.on('mealUpdated', ({ action, meal, mealId }: { action: string; meal: Meal; mealId: string }) => {
      if (action === 'added') {
        if (meal.userId.toString() === DEFAULT_USER_ID.toString()) {
          setMeals(prev =>
            [meal, ...prev].sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
          );
        }
      } else if (action === 'edited') {
        setMeals(prev => prev.map(m => (m._id === meal._id ? meal : m)));
      } else if (action === 'deleted') {
        setMeals(prev => prev.filter(m => m._id !== mealId));
      }
    });

    return () => { socket.disconnect(); };
  }, [fetchMeals, scheduleDailyReminder]);

  const handleSave = async () => {
    if (!description.trim()) return;
    if (saving) return;
    setSaving(true);
    try {
      if (editingMeal) {
        await axios.put(`${API_URL}/meals/${editingMeal._id}`, {
          userId: DEFAULT_USER_ID,
          description: description.trim(),
        });
      } else {
        await axios.post(`${API_URL}/meals`, {
          userId: DEFAULT_USER_ID,
          description: description.trim(),
        });
      }
      setModalVisible(false);
      setDescription('');
      setEditingMeal(null);
      // Always refetch — socket update may not fire on web
      await fetchMeals();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save meal.';
      console.error('[handleSave]', err);
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${API_URL}/meals/${id}`, { data: { userId: DEFAULT_USER_ID } });
          } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to delete meal.');
          }
        },
      },
    ]);
  };

  const openEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setDescription(meal.description);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.gradient} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Meal Log</Text>
          <Text style={styles.subtitle}>{meals.length} meals tracked</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingMeal(null);
            setDescription('');
            setModalVisible(true);
          }}
        >
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={meals}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <MealCard meal={item} onEdit={openEdit} onDelete={handleDelete} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchMeals} tintColor="#6366f1" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Utensils size={48} color="#475569" strokeWidth={1} />
            <Text style={styles.emptyText}>No meals logged yet.</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingMeal ? 'Edit Meal' : 'Add Meal'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#94a3b8" size={24} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="What did you eat?"
              placeholderTextColor="#64748b"
              value={description}
              onChangeText={setDescription}
              multiline
              autoFocus
            />
            <TouchableOpacity
              style={[styles.saveButton, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save Meal'}</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#6366f1',
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
    gap: 16,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    paddingBottom: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    color: '#fff',
    fontSize: 18,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
