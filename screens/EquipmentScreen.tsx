import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/StackNavigator';
 
type Equipment = {
    eq_id: number;
    equipment_name: string;
    description: string;
    equipment_type: string;
    equipment_type_name: string;
    image_name?: string;  // Add image_name to store the image filename
};
 
type EquipmentScreenProps = NativeStackScreenProps<RootStackParamList, 'EquipmentScreen'>;
 
const EquipmentScreen: React.FC<EquipmentScreenProps> = ({ route, navigation }) => {
    const { line_id, line_name,role } = route.params;
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
 
    // Log line_name to check if it's passed correctly
    console.log("Line Name in EquipmentScreen:", line_name);
 
    useEffect(() => {
        fetch(`http://192.168.68.56:5000/api/equipments?line_id=${line_id}`)
            .then(response => response.json())
            .then(data => {
                setEquipment(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching equipment:', error);
                setLoading(false);
            });
    }, [line_id]);
 
    if (loading) {
        return <ActivityIndicator size="large" color="#00b4d8" style={styles.loader} />;
    }
 
    return (
<View style={styles.container}>
            {/* Display line_name here */}
<Text style={styles.header}>Equipments for {line_name}</Text>
<FlatList
                data={equipment}
                keyExtractor={(item) => item.eq_id.toString()}
                renderItem={({ item }) => (
<TouchableOpacity
                        style={styles.equipmentCard}
                        onPress={() => navigation.navigate('PartScreen', { equipment_id: item.eq_id,equipment_name:item.equipment_name,role })} // Navigate to PartScreen
>
<View style={styles.equipmentContent}>
                            {item.image_name && (
<Image
                  source={{ uri: `http://192.168.68.56:8080/images/${item.image_name}` }}
                  style={styles.equipmentImage}
                />
                            )}
<View style={styles.textContainer}>
<Text style={styles.equipmentText}>{item.equipment_name}</Text>
<Text style={styles.equipmentDescription}>{item.description}</Text>
</View>
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
        backgroundColor: '#caf0f8',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#03045e',
    },
    equipmentCard: {
        padding: 15,
        backgroundColor: '#90e0ef',
        marginVertical: 10,
        borderRadius: 8,
        elevation: 3,
    },
    equipmentContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    equipmentImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 10,
        resizeMode: 'cover',
    },
    textContainer: {
        flex: 1,
    },
    equipmentText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#023e8a',
    },
    equipmentDescription: {
        fontSize: 14,
        color: '#555',
        marginTop: 5,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0096c7',
    },
});
 
export default EquipmentScreen;