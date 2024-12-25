// App.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, Animated } from 'react-native';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Icon from 'react-native-vector-icons/Ionicons'; // İkon kütüphanesini ekleyin
import io, { Socket } from "socket.io-client";

const App = () => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<'mp3' | 'mp4'>('mp3');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    // Socket.IO bağlantısını kur
    const newSocket = io('http://127.0.0.1:5000');
    setSocket(newSocket);

    // Progress olayını dinle
    newSocket.on('progress', (data) => {
      setProgress(data.progress);
    });

    // Component unmount olduğunda bağlantıyı kapat
    return () => {
      newSocket.close();
    };
  }, []);

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
      Alert.alert('Hata', 'Lütfen geçerli bir YouTube linki girin');
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
        }
      );

      const fileUri = `${FileSystem.documentDirectory}downloaded-file.${format}`;
      await FileSystem.writeAsStringAsync(fileUri, response.data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      Alert.alert('Başarılı', 'Dosya başarıyla indirildi!');
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert('Hata', 'Dosya indirilirken bir hata oluştu. Lütfen tekrar deneyin.');
      console.error(error);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Icon name="cloud-download" size={40} color="#007BFF" />
          <Text style={styles.title}>YouTube Downloader</Text>
          <Text style={styles.subtitle}>Video ve Ses İndirme Aracı</Text>
        </View>

        <View style={styles.inputContainer}>
          <Icon name="link" size={20} color="#666" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="YouTube linkini yapıştırın"
            placeholderTextColor="#A9A9A9"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {url.length > 0 && (
            <TouchableOpacity 
              onPress={() => setUrl('')} 
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.formatButton, format === 'mp3' && styles.activeButton]}
            onPress={() => setFormat('mp3')}
          >
            <Icon name="musical-note" size={24} color={format === 'mp3' ? '#fff' : '#007BFF'} />
            <Text style={[styles.buttonText, format === 'mp3' && styles.activeButtonText]}>MP3</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.formatButton, format === 'mp4' && styles.activeButton]}
            onPress={() => setFormat('mp4')}
          >
            <Icon name="videocam" size={24} color={format === 'mp4' ? '#fff' : '#007BFF'} />
            <Text style={[styles.buttonText, format === 'mp4' && styles.activeButtonText]}>MP4</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.downloadButton, loading && styles.downloadingButton]}
          onPress={downloadFile}
          disabled={loading || !url}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.downloadText}>İndiriliyor...</Text>
            </View>
          ) : (
            <>
              <Icon name="cloud-download-outline" size={24} color="#fff" />
              <Text style={styles.downloadText}>İndir</Text>
            </>
          )}
        </TouchableOpacity>

        {loading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.max(progress * 100, 5)}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {progress > 0 ? `${Math.round(progress * 100)}%` : 'Hazırlanıyor...'}
            </Text>
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
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#2C3E50',
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
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2ECC71',
    borderRadius: 4,
  },
  progressText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D6DBDF',
    borderRadius: 50,
    backgroundColor: '#FBFCFC',
    paddingHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 10,
  },
  clearButton: {
    padding: 8,
    marginLeft: 5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadingButton: {
    backgroundColor: '#2980B9',
  },
});

export default App;
