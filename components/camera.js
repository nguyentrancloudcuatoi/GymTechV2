import React, { useState, useRef, useEffect } from 'react';
// Sử dụng useCameraPermissions thay vì Permissions từ expo-camera trực tiếp
import { CameraView, useCameraPermissions } from 'expo-camera';
// Import Camera nếu bạn cần request Microphone Permissions riêng biệt (mặc dù useCameraPermissions thường xử lý cả hai)
// import { Camera } from 'expo-camera';
import { Button, StyleSheet, Text, TouchableOpacity, View, Alert, AppState, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function CameraScreen() {
  const navigation = useNavigation();
  const [facing, setFacing] = useState('back');
  // useCameraPermissions yêu cầu cả Camera và Microphone
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUri, setRecordedVideoUri] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false); // <-- Trạng thái mới để theo dõi camera sẵn sàng
  const cameraRef = useRef(null);
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const hasRecordedVideo = !!recordedVideoUri;

  // --- Effects ---

  // Effect xử lý AppState
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if ( appState.current.match(/active|foreground/) && nextAppState === 'background' && isRecording && cameraRef.current) {
        console.log('[App State] Ứng dụng vào nền - Dừng ghi hình...');
        // Dừng ghi hình nếu ứng dụng vào nền
        cameraRef.current.stopRecording();
        // Lưu ý: Khối 'finally' trong toggleRecording sẽ xử lý cập nhật trạng thái
      }
      appState.current = nextAppState;
      console.log('[App State] Đã thay đổi thành:', nextAppState);
    });
    return () => {
      subscription.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRecording]); // Chạy lại nếu isRecording thay đổi

  // --- Permissions ---

  if (!permission) {
    // Quyền đang được tải
    return <SafeAreaView style={styles.container}><View style={styles.permissionContainer}><Text style={styles.message}>Đang yêu cầu quyền...</Text></View></SafeAreaView>;
  }

  if (!permission.granted) {
    // Quyền chưa được cấp (Cả Camera và Microphone)
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.message}>Cần có quyền Máy ảnh và Microphone để quay video.</Text>
          <Button onPress={requestPermission} title="Cấp quyền" />
        </View>
      </SafeAreaView>
    );
  }

  // --- Camera Readiness Callback ---
  const handleCameraReady = () => {
    console.log('[Camera] Đã sẵn sàng');
    setIsCameraReady(true); // <-- Đặt trạng thái camera sẵn sàng thành true
  };

  // --- Timer Logic ---

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current); // Xóa interval hiện có
    setRecordingDuration(0); // Đặt lại thời lượng
    console.log('[Timer] Bắt đầu');
    intervalRef.current = setInterval(() => {
      setRecordingDuration(prevDuration => {
        const newDuration = prevDuration + 1;
        if (newDuration >= 30 && cameraRef.current && isRecording) {
           console.log("[Timer] Thời lượng tối đa (30s) nên kích hoạt dừng thông qua recordAsync.");
           // Để recordAsync xử lý việc dừng dựa trên maxDuration
        }
        return newDuration;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      console.log('[Timer] Dừng');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  // --- Camera Actions ---

  function toggleCameraFacing() {
    if (isRecording || hasRecordedVideo || !isCameraReady) return; // Không cho phép lật khi đang/sau khi ghi hoặc chưa sẵn sàng
    console.log('[Camera] Lật');
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function toggleRecording() {
    // Đảm bảo camera đã sẵn sàng trước khi cố gắng ghi hình
    if (!isCameraReady) {
      console.log('[toggleRecording] Bị chặn: Camera chưa sẵn sàng.');
      Alert.alert("Camera chưa sẵn sàng", "Vui lòng đợi một lát để camera khởi tạo.");
      return;
    }

    // Ngăn chặn bắt đầu ghi hình mới nếu đã có video và chưa được loại bỏ
    if (hasRecordedVideo && !isRecording) {
       console.log('[toggleRecording] Bị chặn: Video đã được ghi. Xem lại hoặc quay lại.');
       Alert.alert("Video đã sẵn sàng", "Một video đã được ghi. Vui lòng sử dụng dấu kiểm để xem lại hoặc nút quay lại để loại bỏ và ghi lại.");
       return;
    }

    if (!cameraRef.current) {
      console.error('[toggleRecording] LỖI: cameraRef là null!');
      Alert.alert('Lỗi Camera', 'Không thể truy cập camera. Vui lòng thử lại.');
      return;
    }

    if (isRecording) {
      // --- DỪNG GHI HÌNH ---
      console.log('[toggleRecording] Yêu cầu Dừng Ghi hình...');
      try {
        // Gọi stopRecording để báo hiệu dừng
        await cameraRef.current.stopRecording();
        console.log('[toggleRecording] stopRecording() đã được gọi. Đang chờ promise giải quyết...');
        // Cập nhật trạng thái (isRecording=false, stopTimer) được xử lý trong khối 'finally'
      } catch (error) {
        console.error('[toggleRecording] Lỗi khi gọi stopRecording:', error);
        Alert.alert('Lỗi', 'Không thể dừng ghi hình một cách sạch sẽ.');
        // Buộc dọn dẹp nếu stopRecording tự ném lỗi (ít phổ biến)
        stopTimer();
        setIsRecording(false);
      }
    } else {
      // --- BẮT ĐẦU GHI HÌNH ---
      console.log('[toggleRecording] Bắt đầu Ghi hình...');
      setRecordedVideoUri(null); // Xóa URI video trước đó
      setIsRecording(true); // Đặt trạng thái ghi hình thành true
      startTimer(); // Bắt đầu hẹn giờ

      try {
        const recordOptions = {
          maxDuration: 30, // Thời lượng ghi hình tối đa tính bằng giây
          quality: CameraView.Constants?.VideoQuality['720p'] ?? '720p', // Sử dụng hằng số nếu có, dự phòng bằng chuỗi
          // mute: false, // Đảm bảo không tắt tiếng nếu bạn muốn có âm thanh (thường là mặc định)
        };
        console.log('[toggleRecording] Gọi recordAsync với các tùy chọn:', recordOptions);

        const videoRecordPromise = cameraRef.current.recordAsync(recordOptions);

        if (videoRecordPromise) {
          console.log('[toggleRecording] Đang chờ promise ghi hình giải quyết...');
          const data = await videoRecordPromise; // Đợi ghi hình kết thúc (maxDuration, stopRecording, hoặc lỗi)
          console.log('[toggleRecording] Promise Ghi hình Đã giải quyết. Dữ liệu:', data);
          if (data?.uri) {
            setRecordedVideoUri(data.uri); // Đặt URI của video đã ghi
            console.log('[toggleRecording] URI Video Đã ghi Được đặt:', data.uri);
             // Kiểm tra phần mở rộng tệp (thường là mp4 hoặc mov trên iOS)
             if (data.uri.endsWith('.mp4')) {
                 console.log('[toggleRecording] Định dạng video có vẻ là MP4.');
             } else {
                 console.warn('[toggleRecording] Định dạng video có thể không phải là MP4:', data.uri.split('.').pop());
             }
          } else {
            // Trường hợp này thường xảy ra với lỗi "dừng trước khi có dữ liệu" nếu stop được gọi sớm
            console.warn('[toggleRecording] Không nhận được URI sau khi ghi hình kết thúc. Có phải nó đã bị dừng quá sớm hoặc bị lỗi nội bộ không?');
            setRecordedVideoUri(null); // Đảm bảo URI là null nếu dữ liệu không hợp lệ
          }
        } else {
          throw new Error('recordAsync không trả về một promise hoặc đối tượng có thể sử dụng.');
        }
      } catch (error) {
        console.error('[toggleRecording] Lỗi Ghi hình:', error); // Ghi lại lỗi cụ thể
        Alert.alert(
            'Lỗi Ghi hình',
            `Không thể ghi video: ${error.message || 'Lỗi không xác định'}. Vui lòng đảm bảo quyền đã được cấp và thử lại.`
        );
        setRecordedVideoUri(null); // Xóa URI khi có lỗi
        // Việc dọn dẹp xảy ra trong finally
      } finally {
        // Khối này thực thi SAU KHI promise giải quyết (ghi hình kết thúc thành công)
        // HOẶC bị từ chối (ghi hình thất bại hoặc bị dừng sớm).
        console.log('[toggleRecording] Khối finally đang thực thi (Kết thúc ghi/dừng).');
        stopTimer(); // Dừng interval hẹn giờ
        setIsRecording(false); // Đặt trạng thái ghi hình thành false
      }
    }
  }

  // --- Navigation ---

  const handleNavigateToDisplay = () => {
    if (!hasRecordedVideo || !recordedVideoUri) {
      Alert.alert("Lỗi", "Không có video để hiển thị.");
      return;
    }
    console.log('Điều hướng đến VideoDisplay với URI:', recordedVideoUri);
    // Đảm bảo màn hình 'VideoDisplay' tồn tại trong thiết lập điều hướng của bạn
    navigation.navigate('VideoDisplay', { videoUri: recordedVideoUri });
  };

  const handleGoBack = () => {
    if (isRecording) return; // Không cho phép quay lại khi đang ghi hình

    if (hasRecordedVideo) {
      // Hỏi xác nhận nếu video đã được ghi
      Alert.alert(
        "Loại bỏ Video?",
        "Bạn có chắc chắn muốn quay lại không? Video đã ghi sẽ bị loại bỏ.",
        [
          { text: "Ở lại", style: "cancel" },
          {
            text: "Loại bỏ & Quay lại",
            style: "destructive",
            onPress: () => {
              console.log('Loại bỏ video và quay lại.');
              setRecordedVideoUri(null); // Loại bỏ video
              setRecordingDuration(0); // Đặt lại hiển thị hẹn giờ nếu cần
              setIsCameraReady(false); // Reset camera ready state perhaps? Test this.
              // Set camera ready to false might require re-initialization logic if user goes back and forth
              // Usually just nullifying the video is enough.
              navigation.goBack();
            }
          }
        ],
        { cancelable: true }
      );
    } else {
      // Không có video nào được ghi, chỉ cần quay lại
      console.log('Quay lại (không có video nào được ghi).');
      navigation.goBack();
    }
  }

  // --- UI Component ---
  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        mode="video" // Đặt chế độ video một cách tường minh
        videoQuality={'720p'} // Cài đặt chất lượng nhất quán
        microphoneEnabled={true} // <-- Bật sử dụng microphone một cách tường minh
        onCameraReady={handleCameraReady} // <-- Đặt callback khi camera sẵn sàng
        onError={(error) => { // <-- Thêm callback xử lý lỗi để gỡ lỗi thêm
          console.error("[CameraView] Lỗi Camera:", error);
          Alert.alert("Lỗi Camera", "Đã xảy ra lỗi với camera: " + error.message);
          setIsCameraReady(false); // Đặt lại trạng thái sẵn sàng khi có lỗi
        }}
      >

        {/* TOP LEFT: NÚT QUAY LẠI */}
        <TouchableOpacity
          style={[ styles.topButton, styles.backButton, (isRecording) ? styles.disabledButton : {} ]}
          onPress={handleGoBack}
          disabled={isRecording} // Vô hiệu hóa khi đang ghi hình
        >
          <Ionicons name="arrow-back-outline" size={28} color="white" />
        </TouchableOpacity>

        {/* CONTAINER DƯỚI CÙNG ĐƯỢC ĐỊNH VỊ TUYỆT ĐỐI */}
        <View style={styles.bottomContainer}>
            {/* TIMER (Hiển thị trong khi ghi hình) */}
            {isRecording && (
              <View style={styles.timerContainer}>
                <View style={styles.recordingIndicator} />
                <Text style={styles.timerText}>{formatTime(recordingDuration)} / 0:30</Text>
              </View>
            )}

            {/* HÀNG ĐIỀU KHIỂN DƯỚI CÙNG */}
            <View style={styles.controlsContainer}>
              {/* TRÁI: NÚT LẬT CAMERA */}
              <TouchableOpacity
                style={[ styles.controlButton, (!isCameraReady || isRecording || hasRecordedVideo) ? styles.disabledButton : {} ]} // Vô hiệu hóa nếu chưa sẵn sàng, đang ghi hoặc đã có video
                onPress={toggleCameraFacing}
                disabled={!isCameraReady || isRecording || hasRecordedVideo} // Vô hiệu hóa nếu chưa sẵn sàng
              >
                <Ionicons name="camera-reverse-outline" size={30} color="white" />
              </TouchableOpacity>

              {/* GIỮA: NÚT GHI / DỪNG */}
              <TouchableOpacity
                style={[
                    styles.controlButton,
                    styles.recordButton,
                    isRecording ? styles.recordingActive : {},
                    // Vô hiệu hóa nếu camera chưa sẵn sàng HOẶC nếu video tồn tại và không đang ghi hình
                    (!isCameraReady || (hasRecordedVideo && !isRecording)) ? styles.disabledButton : {}
                ]}
                onPress={toggleRecording}
                // Vô hiệu hóa nếu camera chưa sẵn sàng HOẶC nếu video tồn tại và không đang ghi hình
                disabled={!isCameraReady || (hasRecordedVideo && !isRecording)}
              >
                <Ionicons
                  name={isRecording ? "square" : "ellipse"} // Hình vuông khi ghi, hình tròn nếu không
                  size={isRecording ? 28 : 35}
                  // Màu đỏ khi sẵn sàng ghi, hình vuông đen khi ghi, đỏ mờ nếu video tồn tại, xám nếu chưa sẵn sàng
                  color={isRecording ? "black" : (hasRecordedVideo ? "rgba(255,0,0,0.3)" : (isCameraReady ? "red" : "grey"))} // Màu xám nếu chưa sẵn sàng
                 />
              </TouchableOpacity>

              {/* PHẢI: NÚT XEM VIDEO / CHỖ GIỮ CHỖ */}
              <View style={styles.controlButton}>
                {/* Chỉ hiển thị dấu kiểm khi video đã được ghi VÀ ghi hình đã dừng */}
                {hasRecordedVideo && !isRecording ? (
                  <TouchableOpacity
                    style={styles.viewVideoButton}
                    onPress={handleNavigateToDisplay}
                    // Không cần vô hiệu hóa ở đây vì nó chỉ hiển thị khi isCameraReady phải là true
                  >
                    <Ionicons name="checkmark-circle" size={38} color="#2ecc71" />
                  </TouchableOpacity>
                ) : (
                  // Placeholder giữ bố cục nhất quán
                  <View style={styles.placeholderView} />
                )}
              </View>
            </View>
        </View>
        {/* Kết thúc Container Dưới cùng Được định vị Tuyệt đối */}

      </CameraView>
      {/* Kết thúc CameraView */}
    </SafeAreaView> // Kết thúc SafeAreaView
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000', // Đảm bảo nền khớp
  },
  message: {
    textAlign: 'center',
    paddingBottom: 20,
    color: 'white',
    fontSize: 18,
  },
  camera: {
    flex: 1,
    position: 'relative', // Cần thiết cho định vị tuyệt đối của các phần tử con
  },
  // --- Nút Trên cùng ---
  topButton: {
    position: 'absolute',
    // Điều chỉnh vị trí trên cùng dựa trên nền tảng và khoảng trống an toàn tiềm năng
    top: Platform.OS === 'ios' ? 50 : 30, // Có thể cần điều chỉnh
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 8, // Điều chỉnh padding một chút
    borderRadius: 22, // Điều chỉnh cho kích thước
    width: 44, height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    left: 15,
  },
  // --- Khu vực Dưới cùng ---
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 35 : 25, // Tăng padding một chút cho chỉ báo home, v.v.
    paddingTop: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 5,
  },
  // --- Timer ---
  timerContainer: {
    marginBottom: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingIndicator: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: 'red', marginRight: 8,
  },
  timerText: {
    color: 'white', fontSize: 14, fontWeight: 'bold', fontVariant: ['tabular-nums'], // Đảm bảo các số thẳng hàng
  },
  // --- Hàng Nút Điều khiển ---
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20, // Thêm một số padding ngang để ngăn các nút chạm vào các cạnh
  },
  // --- Kiểu Cơ bản cho Nút Điều khiển ---
  controlButton: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Nền bán trong suốt
    justifyContent: 'center', alignItems: 'center',
    marginHorizontal: 10, // Khoảng cách giữa các nút
  },
  // --- Kiểu Nút Cụ thể ---
  recordButton: {
    borderWidth: 3, // Thêm viền để phân biệt trực quan
    borderColor: 'transparent', // Viền trong suốt mặc định
    backgroundColor: 'transparent', // Làm cho tâm trong suốt ban đầu
  },
  recordingActive: {
     // Kiểu khi ghi hình đang hoạt động (nút trắng, hình vuông đen bên trong)
     backgroundColor: 'white',
     borderColor: 'rgba(0,0,0,0.1)', // Viền nhẹ khi hoạt động
  },
  viewVideoButton: {
    // Kiểu cho nút dấu kiểm (sử dụng kích thước controlButton)
    justifyContent: 'center', alignItems: 'center',
    width: '100%', height: '100%', borderRadius: 35, // Khớp với phần tử cha
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Trắng gần như đục
    borderWidth: 3,
    borderColor: '#2ecc71', // Viền xanh lá cây để xác nhận
   },
  placeholderView: {
      // Một view trống để duy trì khoảng cách khi dấu kiểm không hiển thị
      width: '100%', height: '100%',
      backgroundColor: 'transparent', // Placeholder vô hình
      borderRadius: 35, // Khớp hình dạng
  },
  // --- Kiểu Tiện ích ---
  disabledButton: {
    opacity: 0.4, // Làm cho các nút bị vô hiệu hóa mờ đi
  },
});