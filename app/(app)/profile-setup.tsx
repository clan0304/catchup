// app/(app)/profile-setup.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useAuth } from '../../context/auth';
import { ProfileData } from '../../types/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { debounce } from 'lodash';

// Define interest categories
const INTEREST_OPTIONS = [
  'Sports',
  'Music',
  'Art',
  'Food',
  'Travel',
  'Technology',
  'Gaming',
  'Fashion',
  'Photography',
  'Reading',
  'Fitness',
  'Cooking',
  'Nature',
  'Movies',
  'Dancing',
];

export default function ProfileSetupScreen() {
  const {
    user,
    completeProfile,
    checkUsernameUnique,
    uploadProfilePhoto,
    signOut,
  } = useAuth();

  // Profile state
  const [username, setUsername] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Form state
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isUsernameUnique, setIsUsernameUnique] = useState(false);
  const [isUsernameChecking, setIsUsernameChecking] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Check username uniqueness with debounce
  const checkUsername = debounce(async (value: string) => {
    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      setIsUsernameUnique(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError(
        'Username can only contain letters, numbers, and underscores'
      );
      setIsUsernameUnique(false);
      return;
    }

    setIsUsernameChecking(true);
    setUsernameError(null);

    try {
      const isUnique = await checkUsernameUnique(value);
      setIsUsernameUnique(isUnique);
      if (!isUnique) {
        setUsernameError('Username is already taken');
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameError('Error checking username');
    } finally {
      setIsUsernameChecking(false);
    }
  }, 500);

  // Handle username changes
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    checkUsername(value);
  };

  // Handle adding/removing interests
  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((item) => item !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  // Handle picking a profile photo
  const pickImage = async () => {
    // Request permission first
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        'Permission Required',
        'You need to grant access to your photos to upload a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  // Handle next step
  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!username || usernameError) {
        Alert.alert('Error', 'Please provide a valid username');
        return;
      }

      if (!instagramUrl) {
        Alert.alert('Error', 'Please provide your Instagram URL');
        return;
      }

      if (!city) {
        Alert.alert('Error', 'Please provide your city');
        return;
      }
    } else if (currentStep === 2) {
      // Validate step 2
      if (interests.length === 0) {
        Alert.alert('Error', 'Please select at least one interest');
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  // Handle previous step
  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Add debug logging
    console.log('Starting profile submission...');
    console.log('Profile data being submitted:', {
      username,
      instagramUrl,
      city,
      bio,
      interests,
      photoUri: photoUri ? 'photo selected' : 'no photo',
    });

    // Final validations
    if (!bio) {
      Alert.alert('Error', 'Please write a short bio');
      return;
    }

    setSubmitLoading(true);
    try {
      let photoUrl = null;

      // Upload photo if selected
      if (photoUri) {
        console.log('Uploading profile photo...');
        const { url, error } = await uploadProfilePhoto(photoUri);
        if (error) {
          console.error('Error uploading photo:', error);
          Alert.alert('Error', 'Failed to upload photo. Please try again.');
          setSubmitLoading(false);
          return;
        }
        photoUrl = url;
        console.log('Photo uploaded successfully, URL:', photoUrl);
      }

      // Prepare profile data
      const profileData: ProfileData = {
        username,
        instagram_url: instagramUrl,
        city,
        interests,
        bio,
      };

      if (photoUrl) {
        profileData.photo_url = photoUrl;
      }

      console.log('Submitting profile data to Supabase...');

      // Submit profile data
      const { error } = await completeProfile(profileData);

      if (error) {
        console.error('Error completing profile:', error);
        Alert.alert('Error', 'Failed to complete profile. Please try again.');
        setSubmitLoading(false); // Make sure to reset loading state on error
      }
      // Note: We don't reset loading here on success
      // The completeProfile function will redirect to home page
    } catch (error) {
      console.error('Error in profile setup:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setSubmitLoading(false); // Always reset loading state on error
    }
  };

  // Render step 1: Basic Info
  const renderStep1 = () => (
    <View className="w-full">
      <Text className="text-lg font-semibold text-gray-800 mb-2">
        Choose a username
      </Text>
      <View className="mb-6">
        <TextInput
          className={`bg-gray-100 rounded-lg p-4 text-base text-gray-800 ${
            usernameError ? 'border border-red-500' : ''
          }`}
          value={username}
          onChangeText={handleUsernameChange}
          placeholder="Username"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isUsernameChecking && (
          <Text className="text-sm text-gray-500 mt-1">
            Checking availability...
          </Text>
        )}
        {usernameError && (
          <Text className="text-sm text-red-500 mt-1">{usernameError}</Text>
        )}
        {isUsernameUnique && username.length > 0 && (
          <Text className="text-sm text-green-500 mt-1">
            Username is available
          </Text>
        )}
      </View>

      <Text className="text-lg font-semibold text-gray-800 mb-2">
        Instagram URL
      </Text>
      <View className="mb-6">
        <TextInput
          className="bg-gray-100 rounded-lg p-4 text-base text-gray-800"
          value={instagramUrl}
          onChangeText={setInstagramUrl}
          placeholder="https://instagram.com/yourusername"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
      </View>

      <Text className="text-lg font-semibold text-gray-800 mb-2">
        Your City
      </Text>
      <View className="mb-6">
        <TextInput
          className="bg-gray-100 rounded-lg p-4 text-base text-gray-800"
          value={city}
          onChangeText={setCity}
          placeholder="New York, Paris, Tokyo, etc."
        />
      </View>
    </View>
  );

  // Render step 2: Interests
  const renderStep2 = () => (
    <View className="w-full">
      <Text className="text-lg font-semibold text-gray-800 mb-2">
        Select your interests
      </Text>
      <Text className="text-base text-gray-600 mb-4">
        Choose at least one interest
      </Text>

      <View className="flex-row flex-wrap">
        {INTEREST_OPTIONS.map((interest) => (
          <TouchableOpacity
            key={interest}
            onPress={() => toggleInterest(interest)}
            className={`m-1 py-2 px-4 rounded-full ${
              interests.includes(interest) ? 'bg-primary' : 'bg-gray-200'
            }`}
          >
            <Text
              className={`text-sm ${
                interests.includes(interest)
                  ? 'text-white font-medium'
                  : 'text-gray-800'
              }`}
            >
              {interest}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render step 3: Photo & Bio
  const renderStep3 = () => (
    <View className="w-full">
      <Text className="text-lg font-semibold text-gray-800 mb-2">
        Profile Photo
      </Text>

      <TouchableOpacity
        onPress={pickImage}
        className="mb-6 items-center justify-center"
      >
        {photoUri ? (
          <View className="items-center">
            <Image
              source={{ uri: photoUri }}
              className="w-32 h-32 rounded-full"
            />
            <Text className="text-primary mt-2">Change Photo</Text>
          </View>
        ) : (
          <View className="w-32 h-32 rounded-full bg-gray-200 items-center justify-center">
            <Text className="text-gray-600 text-4xl">+</Text>
            <Text className="text-gray-600 mt-1">Add Photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text className="text-lg font-semibold text-gray-800 mb-2">Bio</Text>
      <TextInput
        className="bg-gray-100 rounded-lg p-4 text-base text-gray-800 h-32"
        value={bio}
        onChangeText={setBio}
        placeholder="Write a short bio about yourself..."
        multiline
        textAlignVertical="top"
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6">
          <View className="py-6">
            <Text className="text-3xl font-bold text-gray-800">
              Complete Your Profile
            </Text>
            <Text className="text-base text-gray-600 mt-1 mb-6">
              Step {currentStep} of {totalSteps}
            </Text>

            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            <View className="flex-row justify-between mt-8 mb-6">
              {currentStep > 1 ? (
                <TouchableOpacity
                  onPress={handlePreviousStep}
                  className="py-3 px-6"
                >
                  <Text className="text-primary font-semibold">Back</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}

              {currentStep < totalSteps ? (
                <TouchableOpacity
                  onPress={handleNextStep}
                  className="bg-primary py-3 px-6 rounded-lg"
                >
                  <Text className="text-white font-semibold">Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={submitLoading}
                  className={`bg-primary py-3 px-6 rounded-lg ${
                    submitLoading ? 'opacity-70' : ''
                  }`}
                >
                  {submitLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text className="text-white font-semibold">Complete</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity
              className="mt-4 p-3 bg-red-500 rounded-lg self-center"
              onPress={handleSignOut}
            >
              <Text className="text-white font-semibold">Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
