// App.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Icon from 'react-native-vector-icons/Ionicons'; // İkon kütüphanesini ekleyin

const App = () => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp3');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (err) {
      return false;
    }
  };

  const downloadFile = async () => {
    if (!url || !isValidUrl(url)) {
      Alert.alert('Error', 'Please enter a valid YouTube link');
      return;
    }

    setLoading(true);
    setProgress(0);
    try {
      const response = await axios.post(
        'http://127.0.0.1:5000/download',
        { url, format },
        {
          responseType: 'arraybuffer',
          onDownloadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted / 100); // Progress in decimal
          },
        }
      );

      const fileUri = `${FileSystem.documentDirectory}downloaded-file.${format}`;
      await FileSystem.writeAsStringAsync(fileUri, response.data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      Alert.alert('Success', `File downloaded to ${fileUri}`);
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert('Error', 'Failed to download file. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>YouTube Downloader</Text>
        <Text style={styles.subtitle}>Download YouTube videos as MP3 or MP4</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter YouTube link"
          placeholderTextColor="#A9A9A9"
          value={url}
          onChangeText={setUrl}
        />
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.formatButton, format === 'mp3' && styles.activeButton]}
            onPress={() => setFormat('mp3')}
          >
            <Text style={[styles.buttonText, format === 'mp3' && styles.activeButtonText]}>MP3</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.formatButton, format === 'mp4' && styles.activeButton]}
            onPress={() => setFormat('mp4')}
          >
            <Text style={[styles.buttonText, format === 'mp4' && styles.activeButtonText]}>MP4</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={downloadFile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.downloadText}>Download</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F4F8',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: '#F9F9F9',
    fontSize: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  formatButton: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#007BFF',
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  activeButton: {
    backgroundColor: '#007BFF',
    borderColor: '#007BFF',
  },
  buttonText: {
    fontSize: 16,
    color: '#007BFF',
  },
  activeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  downloadButton: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  downloadText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  progressText: {
    marginTop: 5,
    fontSize: 14,
    color: '#333',
  },
});

export default App;
