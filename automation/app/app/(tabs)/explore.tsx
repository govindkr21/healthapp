import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL, DEFAULT_USER_ID } from '@/constants/Config';
import { Meal } from '@/types/meal';
import { Utensils, TrendingUp, Calendar, Clock } from 'lucide-react-native';

export default function SummaryScreen() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeals = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/meals?userId=${DEFAULT_USER_ID}`);
      setMeals(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const todayMeals = meals.filter(m => {
    const d = new Date(m.timestamp);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });

  const weekMeals = meals.filter(m => {
    const d = new Date(m.timestamp);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  });

  const lastMeal = [...meals].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];

  const StatCard = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
  }) => (
    <View style={[styles.statCard, { borderColor: color + '33' }]}>
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchMeals} tintColor="#6366f1" />}
    >
      <LinearGradient colors={['#0f172a', '#1e293b']} style={StyleSheet.absoluteFillObject} />

      <View style={styles.header}>
        <Text style={styles.title}>Daily Summary</Text>
        <Text style={styles.subtitle}>Your meal tracking overview</Text>
      </View>

      <View style={styles.grid}>
        <StatCard
          icon={<Utensils size={22} color="#6366f1" />}
          label="Today"
          value={`${todayMeals.length}`}
          color="#6366f1"
        />
        <StatCard
          icon={<TrendingUp size={22} color="#22d3ee" />}
          label="This Week"
          value={`${weekMeals.length}`}
          color="#22d3ee"
        />
        <StatCard
          icon={<Calendar size={22} color="#f59e0b" />}
          label="All Time"
          value={`${meals.length}`}
          color="#f59e0b"
        />
        <StatCard
          icon={<Clock size={22} color="#10b981" />}
          label="Last Meal"
          value={
            lastMeal
              ? new Date(lastMeal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '—'
          }
          color="#10b981"
        />
      </View>

      {todayMeals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Meals</Text>
          {todayMeals.map((meal, i) => (
            <View key={meal._id} style={styles.mealRow}>
              <Text style={styles.mealIndex}>{i + 1}</Text>
              <View style={styles.mealInfo}>
                <Text style={styles.mealDesc}>{meal.description}</Text>
                <Text style={styles.mealTime}>
                  {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {todayMeals.length === 0 && !loading && (
        <View style={styles.empty}>
          <Utensils size={48} color="#334155" strokeWidth={1} />
          <Text style={styles.emptyText}>No meals logged today yet.</Text>
          <Text style={styles.emptyHint}>Switch to the Meals tab to add one!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    borderRadius: 12,
    padding: 10,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 16,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  mealIndex: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },
  mealInfo: { flex: 1 },
  mealDesc: { color: '#f8fafc', fontSize: 15, fontWeight: '500' },
  mealTime: { color: '#64748b', fontSize: 12, marginTop: 2 },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyText: { color: '#64748b', fontSize: 16, fontWeight: '600' },
  emptyHint: { color: '#334155', fontSize: 14, textAlign: 'center' },
});
