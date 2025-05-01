import React from 'react';
import { View, Text, StyleSheet, Image, Button } from 'react-native';
import { Feather } from '@expo/vector-icons';

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
     <Feather name="user" size={100} color="#666" style={styles.avatar} />
      <Text style={styles.username}>Username Placeholder</Text>
      <Text style={styles.stat}>Total Hunts: 0</Text>
      <Text style={styles.stat}>Tagged Locations: 0</Text>
      <View style={styles.buttonContainer}>
        <Button title="Edit Profile" onPress={() => {}} />
      </View>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stat: {
    fontSize: 16,
    marginBottom: 5,
  },
  buttonContainer: {
    marginTop: 20,
  },
});