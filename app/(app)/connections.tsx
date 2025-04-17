// app/(app)/connections.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth';
import { getUserConnections, disconnectUser } from '../../services/connections';
import { Ionicons } from '@expo/vector-icons';
import { UserConnection } from '../../services/connections';
import { RefreshControl } from 'react-native';

export default function ConnectionsScreen() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<UserConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [disconnectingIds, setDisconnectingIds] = useState<{
    [key: string]: boolean;
  }>({});

  // Load connections
  const loadConnections = async () => {
    if (!user) return;

    try {
      const { connections: userConnections, error } = await getUserConnections(
        user.id
      );

      if (error) {
        console.error('Error loading connections:', error);
        Alert.alert('Error', 'Failed to load your connections');
      } else {
        setConnections(userConnections);
      }
    } catch (error) {
      console.error('Error in loadConnections:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load connections on component mount
  useEffect(() => {
    loadConnections();
  }, [user]);

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadConnections();
  };

  // Handle disconnecting from a user
  const handleDisconnect = async (connectionId: string, username: string) => {
    Alert.alert(
      'Disconnect',
      `Are you sure you want to disconnect from ${username}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            setDisconnectingIds((prev) => ({ ...prev, [connectionId]: true }));

            try {
              const { error } = await disconnectUser(connectionId);

              if (error) {
                console.error('Error disconnecting:', error);
                Alert.alert('Error', 'Failed to disconnect. Please try again.');
              } else {
                // Remove the connection from the list
                setConnections((prev) =>
                  prev.filter((conn) => conn.connectionId !== connectionId)
                );
                Alert.alert('Success', `You've disconnected from ${username}`);
              }
            } catch (error) {
              console.error('Error in handleDisconnect:', error);
              Alert.alert('Error', 'Something went wrong. Please try again.');
            } finally {
              setDisconnectingIds((prev) => ({
                ...prev,
                [connectionId]: false,
              }));
            }
          },
        },
      ]
    );
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#5E72E4" />
        <Text className="mt-4 text-gray-600">Loading connections...</Text>
      </SafeAreaView>
    );
  }

  // Render connection cards
  const renderConnectionCard = (connection: UserConnection) => (
    <View
      key={connection.connectionId}
      className="flex-row items-center bg-gray-50 rounded-xl p-4 mb-3"
    >
      {connection.photoUrl ? (
        <Image
          source={{ uri: connection.photoUrl }}
          className="w-16 h-16 rounded-full"
        />
      ) : (
        <View className="w-16 h-16 rounded-full bg-gray-300 items-center justify-center">
          <Text className="text-gray-600 text-xl font-bold">
            {connection.username?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
      )}

      <View className="ml-4 flex-1">
        <Text className="text-lg font-semibold text-gray-800">
          {connection.username}
        </Text>
        <Text className="text-gray-600">{connection.city}</Text>

        <View className="flex-row mt-2 flex-wrap">
          {connection.interests &&
            connection.interests.slice(0, 3).map((interest, index) => (
              <View
                key={index}
                className="bg-blue-100 px-2 py-1 rounded-full mr-2 mb-1"
              >
                <Text className="text-xs text-blue-800">{interest}</Text>
              </View>
            ))}

          {connection.interests && connection.interests.length > 3 && (
            <Text className="text-xs text-gray-500 ml-1 mt-1">
              +{connection.interests.length - 3} more
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        className="bg-gray-200 py-2 px-3 rounded-lg"
        onPress={() =>
          handleDisconnect(connection.connectionId, connection.username)
        }
        disabled={disconnectingIds[connection.connectionId]}
      >
        {disconnectingIds[connection.connectionId] ? (
          <ActivityIndicator size="small" color="#5E72E4" />
        ) : (
          <Text className="text-gray-800 font-medium">Disconnect</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Ionicons name="people-outline" size={64} color="#CBD5E1" />
      <Text className="text-gray-400 mt-4 text-center">
        You don't have any connections yet.
      </Text>
      <Text className="text-gray-400 text-center">
        Connect with others to build your network.
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-6 pb-4">
        <Text className="text-3xl font-bold text-gray-800">Connections</Text>
        <Text className="text-base text-gray-600 mt-1">
          People you've connected with
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {connections.length === 0
          ? renderEmptyState()
          : connections.map(renderConnectionCard)}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
