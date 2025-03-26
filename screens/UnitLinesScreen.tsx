import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/StackNavigator';
type UnitLine = {
  line_id: number;
  line_name: string;
  image_name?: string;  // Add this field to store image name
};
type UnitLinesScreenProps = NativeStackScreenProps<RootStackParamList, 'UnitLinesScreen'>;
const UnitLinesScreen: React.FC<UnitLinesScreenProps> = ({ route, navigation }) => {
  const { unit_id,unit_name,role } = route.params;
  const [unitLines, setUnitLines] = useState<UnitLine[]>([]);
  const [loading, setLoading] = useState(true);
console.log("Unit ID:", unit_id);  
  console.log("Unit Name:", unit_name)
  useEffect(() => {
    fetch(`http://192.168.68.56:5000/api/unit_lines?unit_id=${unit_id}`) // 🔹 Updated IP for correctness
      .then((response) => response.json())
      .then((data) => {
        setUnitLines(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching unit lines:', error);
        setLoading(false);
      });
  }, [unit_id]);
  if (loading) {
    return <ActivityIndicator size="large" color="#00b4d8" style={styles.loader} />;
  }
  return (
<View style={styles.container}>
<Text style={styles.header}>Unit Lines for {unit_name}</Text>
<FlatList
        data={unitLines}
        keyExtractor={(item) => item.line_id.toString()}
        renderItem={({ item }) => (
<TouchableOpacity
            style={styles.lineCard}
            onPress={() => navigation.navigate('EquipmentScreen', { line_id: item.line_id, line_name:item.line_name,role })} // ✅ Navigate to EquipmentScreen
>
<View style={styles.lineContent}>
              {/* Conditionally render the image */}
              {item.image_name && (
<Image
                  source={{ uri: `http://192.168.68.56:8080/images/${item.image_name}` }}
                  style={styles.lineImage}
                />
              )}
<Text style={styles.lineText}>{item.line_name}</Text>
</View>
</TouchableOpacity>
        )}
      />
</View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#caf0f8', // Background color updated
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#03045e', // Header color updated
  },
  lineCard: {
    padding: 15,
    backgroundColor: '#90e0ef', // Card background color updated
    marginVertical: 10,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#48cae4', // Shadow color updated
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  lineContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lineImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10, // Add some space between image and text
    resizeMode: 'cover',
  },
  lineText: {
    fontSize: 18,
    color: '#023e8a', // Text color updated
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0096c7', // Loader background color updated
  },
});
export default UnitLinesScreen;