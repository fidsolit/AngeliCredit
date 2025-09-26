import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { ActivityItem } from '../lib/types';
import { formatCurrency, formatTimeAgo, getActivityIcon, getActivityColor } from '../lib/utils';

interface RecentActivityProps {
  activities: ActivityItem[];
  loading: boolean;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  loading,
}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <Text h4 style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      </View>
    );
  }

  if (activities.length === 0) {
    return (
      <View style={styles.container}>
        <Text h4 style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={48} color="#ff751f" />
          <Text style={styles.emptyText}>No recent activity</Text>
          <Text style={styles.emptySubtext}>
            Your loan applications and transactions will appear here
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text h4 style={styles.sectionTitle}>Recent Activity</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {activities.map((activity) => (
          <Card key={activity.id} containerStyle={styles.activityCard}>
            <View style={styles.activityContent}>
              <View style={styles.activityHeader}>
                <View style={[styles.iconContainer, { backgroundColor: getActivityColor(activity.type) }]}>
                  <Ionicons 
                    name={getActivityIcon(activity.type) as any} 
                    size={20} 
                    color="white" 
                  />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityTime}>
                    {formatTimeAgo(activity.timestamp)}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.activityDescription}>
                {activity.description}
              </Text>
              
              {activity.amount && (
                <Text style={styles.activityAmount}>
                  {formatCurrency(activity.amount)}
                </Text>
              )}
              
              {activity.status && (
                <View style={[styles.statusBadge, { backgroundColor: getActivityColor(activity.type) }]}>
                  <Text style={styles.statusText}>
                    {activity.status.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#212529',
    fontWeight: '600',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  activityCard: {
    width: 280,
    borderRadius: 12,
    padding: 16,
    marginRight: 15,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#ff751f',
  },
  activityDescription: {
    fontSize: 14,
    color: '#ff751f',
    marginBottom: 8,
    lineHeight: 20,
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28a745',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#ff751f',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff751f',
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ff751f',
    textAlign: 'center',
    lineHeight: 20,
  },
});
