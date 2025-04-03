import React, { useState, useRef } from 'react'; // Import React
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons

export default function CameraScreen() {
  const [facing, setFacing] = useState('back'); // 'back' or 'front'
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef(null); // Reference to the CameraView component

  // Check camera permissions
  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  // Function to toggle camera facing (front/back)
  function toggleCameraFacing() {
    if (isRecording) return; // Prevent flipping while recording
    setFacing(current => (current === 'back' ? 'front' : 'back'));
    console.log('Camera facing changed to:', facing === 'back' ? 'front' : 'back');
  }

  // Function to take a picture
  async function takePicture() {
    if (isRecording) {
      console.log('Cannot take picture while recording.');
      return; // Don't allow taking picture while recording
    }
    if (cameraRef.current) {
      console.log('Taking picture...');
      try {
        // Options can be added here, e.g., quality, base64, exif
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        console.log('Photo taken:', photo.uri);
        // You might want to navigate to a preview screen or save the image
        Alert.alert('Picture Taken', `Photo saved temporarily at: ${photo.uri}`);
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Could not take picture.');
      }
    } else {
      console.log('Camera ref not available');
    }
  }

  // Function to start/stop video recording
  async function toggleRecording() {
    if (!cameraRef.current) {
      console.log('Camera ref not available for recording');
      return;
    }

    if (isRecording) {
      // Stop recording
      console.log('Stopping recording...');
      cameraRef.current.stopRecording();
      // setIsRecording(false) will be handled in the finally block
    } else {
      // Start recording
      setIsRecording(true); // Update UI immediately
      console.log('Starting recording...');
      try {
        // Optional: Add recording options like quality, maxDuration, maxFileSize
        const videoRecordPromise = cameraRef.current.recordAsync({
          // quality: Camera.Constants.VideoQuality['720p'],
        });

        if (videoRecordPromise) {
          // Wait for stopRecording() to be called and the promise to resolve
          const data = await videoRecordPromise;
          console.log('Video recorded:', data.uri);
          // You might want to navigate to a preview screen or save the video
          Alert.alert('Recording Complete', `Video saved temporarily at: ${data.uri}`);
        }
      } catch (error) {
        console.error('Error recording video:', error);
        Alert.alert('Error', 'Could not record video.');
        // Ensure state is reset even if there's an error starting recording
        setIsRecording(false);
      } finally {
        // This runs after the promise resolves (stopRecording called) or rejects (error during recording)
        // Important: Ensure this is always called to reset the state
        setIsRecording(false);
        console.log('Recording state set to false in finally block.');
      }
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        // Add any other CameraView props needed, e.g.,
        // mode={'video'} // Prioritize video optimization
        // videoQuality={'720p'}
        // flash={'off'}
      >
        {/* Container for control buttons */}
        <View style={styles.controlsContainer}>
          {/* Flip Camera Button */}
          <TouchableOpacity
            style={[styles.controlButton, isRecording ? styles.disabledButton : {}]}
            onPress={toggleCameraFacing}
            disabled={isRecording} // Functionally disable if recording
          >
            <Ionicons name="camera-reverse-outline" size={30} color="white" />
          </TouchableOpacity>

          {/* Take Picture Button (Shutter) */}
          <TouchableOpacity
            style={[styles.shutterButton, isRecording ? styles.disabledButton : {}]}
            onPress={takePicture}
            disabled={isRecording} // Functionally disable if recording
          >
             {/* Larger icon for the main action */}
            <Ionicons name="radio-button-off-outline" size={80} color="white" />
          </TouchableOpacity>

          {/* Record/Stop Video Button */}
          <TouchableOpacity
            style={[
              styles.controlButton, // Base style for the circular button
              styles.recordButtonContainer, // Specific container for potential background changes
              isRecording ? styles.recordingActive : {}, // Style changes when recording
            ]}
            onPress={toggleRecording}
          >
            {/* Icon changes based on recording state */}
            <Ionicons
              name={isRecording ? "square" : "ellipse"} // square for stop, ellipse for record
              size={30} // Icon size
              color={isRecording ? "black": "red"} // Icon color (black on white bg, red on transparent bg)
             />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

// StyleSheet remains the same as the previous version with icons
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end', // Push controls to the bottom
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space out buttons: flip | shutter | record
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent background for controls
    paddingHorizontal: 30, // Horizontal padding
    paddingBottom: 40, // Bottom padding (pushes controls up a bit)
    paddingTop: 20,    // Top padding within the control bar
  },
  // Base style for circular side buttons (flip, record)
  controlButton: {
    borderRadius: 50, // Make it a circle
    width: 60,        // Fixed width
    height: 60,       // Fixed height
    alignItems: 'center',      // Center icon horizontally
    justifyContent: 'center', // Center icon vertically
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Slightly transparent white
  },
  // Style for the central shutter button (take picture)
  shutterButton: {
    alignItems: 'center',      // Center icon horizontally
    justifyContent: 'center', // Center icon vertically
    // Size is determined by the large icon itself
    // No background color for the standard shutter look
  },
  // Container specifically for the record button (allows background color change)
  recordButtonContainer: {
     // Inherits size/shape from controlButton
     // Allows specific background styling when recording
  },
  // Style applied to recordButtonContainer WHEN recording
  recordingActive: {
    backgroundColor: 'white', // White background when recording is active
  },
  // Style for any disabled button
  disabledButton: {
    opacity: 0.5, // Make button look faded/disabled
  },
});