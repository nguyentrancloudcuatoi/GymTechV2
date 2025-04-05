import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Video, ResizeMode } from 'expo-av'; // Import ResizeMode
import { useRoute } from '@react-navigation/native'; // Hook để lấy tham số route

export default function VideoDisplayScreen() {
  const route = useRoute(); // Lấy thông tin route hiện tại
  // Lấy 'videoUri' được truyền từ CameraScreen qua route.params
  const videoUri = route.params?.videoUri; // Sử dụng optional chaining (?) đề phòng params undefined

  const videoRef = useRef(null); // Ref cho component Video

  // Dữ liệu thông báo giả lập (placeholder)
  const [notifications] = useState([
    { id: 1, message: 'Thông báo: Video đã được tải cục bộ.' },
    { id: 2, message: 'Thông báo: Sẵn sàng để phát.' },
    { id: 3, message: 'Thông báo: (Đây là dữ liệu giả lập).' },
  ]);

  // Xử lý trường hợp không nhận được videoUri
  if (!videoUri) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Lỗi: Không tìm thấy đường dẫn video.</Text>
        <Text style={styles.errorText}>(Có thể bạn đã truy cập màn hình này trực tiếp?)</Text>
      </View>
    );
  }

  // --- Giao diện Component ---
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Xem Lại Video Vừa Quay</Text>

      {/* Component Video của expo-av */}
      <Video
        ref={videoRef}
        style={styles.video}
        source={{ uri: videoUri }} // Nguồn video là URI cục bộ được truyền vào
        useNativeControls // Hiển thị các nút điều khiển mặc định (play, pause, âm lượng, fullscreen)
        resizeMode={ResizeMode.CONTAIN} // Đảm bảo video hiển thị trọn vẹn trong khung
        isLooping={false} // Không lặp lại video
        onError={(error) => console.error("Lỗi Video Player:", error)} // Bắt lỗi nếu có
        onLoad={() => console.log(`Đã tải video: ${videoUri}`)} // Log khi video tải xong
      />

      {/* Khu vực hiển thị thông báo */}
      <View style={styles.notificationsContainer}>
        <Text style={styles.notiTitle}>Thông báo (Giả lập):</Text>
        {/* Kiểm tra nếu mảng notifications có phần tử */}
        {notifications.length > 0 ? (
          // Lặp qua mảng và hiển thị từng thông báo
          notifications.map((noti) => (
            <Text key={noti.id} style={styles.notiItem}>
              - {noti.message}
            </Text>
          ))
        ) : (
          // Hiển thị nếu không có thông báo
          <Text>Không có thông báo nào.</Text>
        )}
      </View>
    </ScrollView>
  );
}

// --- Định nghĩa Styles ---
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { flex: 1, padding: 15, backgroundColor: '#f4f4f4' }, // Nền sáng hơn
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#333' },
  video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: 'black', marginBottom: 20, borderRadius: 8 }, // Bo góc video
  notificationsContainer: { marginTop: 10, padding: 15, borderTopWidth: 1, borderTopColor: '#e0e0e0', backgroundColor: '#fff', borderRadius: 8 }, // Nền trắng, bo góc
  notiTitle: { fontSize: 17, fontWeight: '600', marginBottom: 8, color: '#444' },
  notiItem: { fontSize: 15, marginBottom: 5, color: '#555', lineHeight: 20 },
  errorText: { color: 'red', textAlign: 'center', fontSize: 16 },
});