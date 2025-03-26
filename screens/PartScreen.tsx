import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/StackNavigator';
type Part = {
    part_id: number;
    part_name: string;
    stage:string;
    approval_status :string;
    description: string;
    part_type: string;
    parttype_name:string;
    image_name?: string;  // Add image_name to store the image filename
};
type PartScreenProps = NativeStackScreenProps<RootStackParamList, 'PartScreen'>;
const PartScreen: React.FC<PartScreenProps> = ({ route, navigation }) => {
    const { equipment_id, equipment_name, role } = route.params; // Getting the equipment_id passed as a parameter
    const [parts, setParts] = useState<Part[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
 
    useEffect(() => {
        fetch(`http://192.168.68.56:5000/api/parts?equipment_id=${equipment_id}`)
            .then(response => response.json())
            .then(data => {
                setParts(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error fetching parts:', error);
                setLoading(false);
            });
    }, [equipment_id]);
 
    // Group parts by part_type
    const groupedParts = (Array.isArray(parts) ? parts : []).reduce((groups, item) => {
        const { parttype_name } = item;
        if (!groups[parttype_name]) {
            groups[parttype_name] = [];
        }
        groups[parttype_name].push(item);
        return groups;
    }, {} as Record<string, Part[]>);
 
    const sections = Object.keys(groupedParts).map(type => ({
        title: type,
        data: groupedParts[type],
    }));
 
    const toggleSection = (type: string) => {
        const newExpandedSections = new Set(expandedSections);
        if (newExpandedSections.has(type)) {
            newExpandedSections.delete(type);
        } else {
            newExpandedSections.add(type);
        }
        setExpandedSections(newExpandedSections);
    };
 
    if (loading) {
        return <ActivityIndicator size="large" color="#00b4d8" style={styles.loader} />;
    }
 
    return (
        <View style={styles.container}>
            <Text style={styles.header}>Parts for {equipment_name}</Text>
            <FlatList
                data={sections}
                keyExtractor={(item) => item.title}
                renderItem={({ item }) => (
                    <>
                        <TouchableOpacity
                            style={styles.sectionHeader}
                            onPress={() => toggleSection(item.title)}
                        >
                            <Text style={styles.sectionHeaderText}>{item.title}</Text>
                            <Text style={styles.arrow}>
                                {expandedSections.has(item.title) ? 'v' : '>'}
                            </Text>
                        </TouchableOpacity>
                        {expandedSections.has(item.title) && (
                            <FlatList
                                data={item.data}
                                keyExtractor={(part) => part.part_id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.partCard}
                                        onPress={() => {
                                            // General inspector check
                                            if (role === 'inspector') {
                                                navigation.navigate('InspectionScreen', { part_id: item.part_id, role });
                                            }
                                            // Manager stage check
                                            else if (role === 'manager' && item.stage === 'Inspection Stage Completed') {
                                                navigation.navigate('ManagerScreen', { part_id: item.part_id, role });
                                            }
 
                                            else if (role === 'inspector2' && item.stage === 'Manager Stage completed') {
                                                navigation.navigate('ChecklistScreen', { part_id: item.part_id, role });
                                            }
                                            // Approver 1 stage check
                                            else if (role === 'approver1' && item.stage === 'After Inspection Stage Completed') {
                                                navigation.navigate('ApproverPage', { part_id: item.part_id, role });
                                            }
                                            // Approver 2 stage check
                                            else if (role === 'approver2' && item.stage === 'Approver1 Stage Completed' && item.approval_status==='Approved') {
                                                navigation.navigate('ApproverPage2', { part_id: item.part_id, role });
                                            }
                                            // Approver 3 stage check
                                            else if (role === 'approver3' && item.stage === 'Approver2 Stage Completed'&& item.approval_status==='Approved') {
                                                navigation.navigate('ApproverPage3', { part_id: item.part_id, role });
                                            }
                                            // Approver 4 stage check
                                            else if (role === 'approver4' && item.stage === 'Approver3 Stage Completed'&& item.approval_status==='Approved') {
                                                navigation.navigate('ApproverPage4', { part_id: item.part_id, role });
                                            }
                                            // Approver 5 stage check
                                            else if (role === 'approver5' && item.stage === 'Approver4 Stage Completed'&& item.approval_status==='Approved') {
                                                navigation.navigate('ApproverPage5', { part_id: item.part_id, role });
                                            }
                                            else {
                                                alert('You cannot navigate to this page because the stage is not complete yet.');
                                            }
                                        }}
                                    >
                                        <View style={styles.partContent}>
                                            {/* Conditionally render the image */}
                                            {item.image_name && (
                                                <Image
                                                    source={{ uri: `http://192.168.68.56:8080/images/${item.image_name}` }}
                                                    style={styles.partImage}
                                                />
                                            )}
                                            <View style={styles.textContainer}>
                                                <Text style={styles.partName}>{item.part_name}</Text>
                                                <Text style={styles.partDescription}>{item.description}</Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    partCard: {
        padding: 15,
        backgroundColor: '#90e0ef',
        marginVertical: 10,
        borderRadius: 8,
        elevation: 3,
        shadowColor: '#48cae4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    partContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    partImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 10,  // Space between the image and text
        resizeMode: 'cover',
    },
    textContainer: {
        flex: 1, // To ensure the text takes up remaining space
    },
    partName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#023e8a',
    },
    partDescription: {
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
    sectionHeader: {
        padding: 10,
        backgroundColor: '#48cae4',
        borderRadius: 8,
        marginVertical: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionHeaderText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#023e8a',
    },
    arrow: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#023e8a',
    },
    separator: {
        height: 1,
        backgroundColor: '#ccc',
        marginVertical: 5,
    },
});
export default PartScreen;