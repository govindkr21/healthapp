import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Edit2, Trash2, Clock } from 'lucide-react-native';
import { Meal } from '@/types/meal';

type Props = {
  meal: Meal;
  onEdit: (meal: Meal) => void;
  onDelete: (id: string) => void;
};

const MealCard = ({ meal, onEdit, onDelete }: Props) => {
  const time = new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.timeContainer}>
          <Clock size={14} color="#6366f1" />
          <Text style={styles.time}>{time}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onEdit(meal)} style={styles.iconButton}>
            <Edit2 size={18} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(meal._id)} style={styles.iconButton}>
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.description}>{meal.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  time: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  description: {
    color: '#f8fafc',
    fontSize: 16,
    lineHeight: 22,
  },
});

export default MealCard;
