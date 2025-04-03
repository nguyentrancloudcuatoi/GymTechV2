import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Video } from 'expo-av';
import Camera from './components/camera'; 

// --- DATA, Stack, Item, HomeScreen, DetailScreen (giữ nguyên) ---
const DATA = [
    { id: '1', title: 'Squat', image: require('.assets/image/squad.png'), description: 'Squats help build strength in your legs.', video: require('.assets/image/squad.mp4'), instructions: 'Stand tall, lower your body by pushing your hips back, thighs parallel to the ground, keep weight on your heels, and rise up while squeezing your glutes.' },
    { id: '2', title: 'Plank', image: require('.assets/image/plank.png'), description: 'Planks are great for core strength.', video: require('.assets/image/plank.mp4'), instructions: "Forearms on the ground, body straight, core tight, don't lift hips too high or drop them low, hold and breathe steadily." },
    { id: '3', title: 'Push ups', image: require('.assets/image/pushups.png'), description: 'Push-ups are a classic upper body exercise.', video: require('.assets/image/pushups.mp4'), instructions: 'Keep your body straight from head to heels, lower your chest to almost touch the floor and then push up' },
];
const Stack = createNativeStackNavigator();

const Item = ({ title, image, onPress }) => (
  <TouchableOpacity style={styles.item} onPress={onPress}>
    <Image source={image} style={styles.image} resizeMode="contain" />
    <Text style={styles.title}>{title}</Text>
  </TouchableOpacity>
);

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Skills</Text>
      <FlatList
        style={styles.list}
        data={DATA}
        renderItem={({ item }) => (
          <Item
            title={item.title}
            image={item.image}
            onPress={() => navigation.navigate('Detail', { item })}
          />
        )}
        keyExtractor={item => item.id}
      />
      <StatusBar style="auto" />
    </View>
  );
};

const DetailScreen = ({ route, navigation }) => {
  const { item } = route.params;
  return (
    <View style={styles.detailContainer}>
      <Video
        source={item.video}
        style={styles.detailVideo}
        resizeMode="contain"
        isLooping
        shouldPlay
        useNativeControls // Add controls for better UX
      />
      <Text style={styles.detailTitle}>{item.title}</Text>
      <Text style={styles.detailDescription}>{item.description}</Text>

      <View style={styles.additionalInfoContainer}>
        <Text style={styles.additionalInfoTitle}>Instructions:</Text>
        <Text style={styles.additionalInfoText}>
          {item.instructions}
        </Text>
      </View>

      {/* Button to navigate to Camera */}
      <TouchableOpacity 
        style={styles.cameraButton}
        onPress={() => navigation.navigate('Camera')}
      >
        <Text style={styles.cameraButtonText}>Go to Camera</Text>
      </TouchableOpacity>
    </View>
  );
};

// Camera Component Screen
const CameraScreen = () => {
  return (
    <Camera /> 
  );
};

// --- App component and Styles ---
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Exercise List' }} />
        <Stack.Screen name="Detail" component={DetailScreen} options={({ route }) => ({ title: route.params.item.title })} />
        <Stack.Screen name="Camera" component={CameraScreen} options={{ title: 'Camera' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingTop: 20, alignItems: 'center', justifyContent: 'center' },
  header: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#2c3e50' },
  list: { width: '100%' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#ffffff', marginVertical: 8, marginHorizontal: 16, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  title: { fontSize: 20, color: '#34495e', fontWeight: '600', marginLeft: 15, flexShrink: 1 },
  image: { width: 80, height: 80, borderRadius: 8, resizeMode: 'contain' },
  detailContainer: { flex: 1, backgroundColor: '#ffffff', padding: 15 },
  detailVideo: { width: '100%', aspectRatio: 16 / 9, borderRadius: 10, marginBottom: 20, backgroundColor: '#000' },
  detailTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, color: '#2c3e50', textAlign: 'center' },
  detailDescription: { fontSize: 16, color: '#34495e', textAlign: 'left', marginBottom: 20, lineHeight: 22 },
  additionalInfoContainer: { backgroundColor: '#e9ecef', padding: 15, borderRadius: 8, width: '100%', marginBottom: 30 },
  additionalInfoTitle: { fontSize: 18, fontWeight: 'bold', color: '#495057', marginBottom: 10 },
  additionalInfoText: { fontSize: 15, color: '#495057', lineHeight: 21 },
  cameraButton: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#3498db', borderRadius: 8 },
  cameraButtonText: { fontSize: 18, color: '#fff', fontWeight: '600' },
});
