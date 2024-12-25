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
          <Icon name="musical-note" size={18} color={format === 'mp3' ? '#fff' : '#007BFF'} />
          <Text style={[styles.buttonText, format === 'mp3' && styles.activeButtonText]}>MP3</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.formatButton, format === 'mp4' && styles.activeButton]}
          onPress={() => setFormat('mp4')}
        >
          <Icon name="videocam" size={18} color={format === 'mp4' ? '#fff' : '#007BFF'} />
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
          <>
            <Icon name="cloud-download-outline" size={20} color="#fff" />
            <Text style={styles.downloadText}>Download</Text>
          </>
        )}
      </TouchableOpacity>
            {loading && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>
      )}

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2C3E50',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#34495E',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D6DBDF',
    padding: 15,
    marginBottom: 20,
    borderRadius: 50,
    backgroundColor: '#FBFCFC',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
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
    borderRadius: 25,
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#ECF6FF',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: '#007BFF',
    borderColor: '#0056B3',
  },
  buttonText: {
    fontSize: 16,
    color: '#007BFF',
    marginLeft: 5,
  },
  activeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  downloadButton: {
    backgroundColor: '#3498DB',
    padding: 15,
    borderRadius: 50,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  downloadText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  progressContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007BFF',
  },
  progressText: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
  },
});


export default App;
