// app/(app)/classes.tsx
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface classesProps {
  title: string;
  instructor: string;
  schedule: string;
  color: string;
}
// Sample class data
const CLASSES = [
  {
    id: 1,
    title: 'Introduction to Programming',
    instructor: 'Dr. Smith',
    schedule: 'Mon, Wed 10:00 AM',
    color: 'bg-blue-500',
  },
  {
    id: 2,
    title: 'Data Structures',
    instructor: 'Prof. Johnson',
    schedule: 'Tue, Thu 2:00 PM',
    color: 'bg-purple-500',
  },
  {
    id: 3,
    title: 'Web Development',
    instructor: 'Sarah Williams',
    schedule: 'Fri 1:00 PM',
    color: 'bg-green-500',
  },
  {
    id: 4,
    title: 'Machine Learning',
    instructor: 'Dr. Lee',
    schedule: 'Wed, Fri 9:00 AM',
    color: 'bg-yellow-500',
  },
];

// Class card component
const ClassCard = ({ title, instructor, schedule, color }: classesProps) => (
  <TouchableOpacity
    className={`${color} rounded-xl p-5 mb-4 shadow-sm`}
    activeOpacity={0.7}
  >
    <Text className="text-white text-xl font-bold mb-2">{title}</Text>
    <Text className="text-white opacity-90 mb-1">{instructor}</Text>
    <View className="flex-row items-center mt-2">
      <Ionicons name="time-outline" size={16} color="white" />
      <Text className="text-white opacity-90 ml-1">{schedule}</Text>
    </View>
  </TouchableOpacity>
);

export default function ClassesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-6 pt-6 pb-4">
        <Text className="text-3xl font-bold text-gray-800">Classes</Text>
        <Text className="text-base text-gray-600 mt-1">
          Browse your enrolled classes
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {CLASSES.map((classItem) => (
          <ClassCard
            key={classItem.id}
            title={classItem.title}
            instructor={classItem.instructor}
            schedule={classItem.schedule}
            color={classItem.color}
          />
        ))}

        <TouchableOpacity className="flex-row items-center justify-center bg-gray-100 rounded-xl p-5 mb-12">
          <Ionicons name="add-circle-outline" size={24} color="#5E72E4" />
          <Text className="text-primary font-semibold ml-2">
            Browse more classes
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
