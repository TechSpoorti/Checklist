import React, { useLayoutEffect, useState, useCallback, useEffect } from "react";
import { 
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, 
  RefreshControl, Image, Modal, Alert 
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/StackNavigator";
import Icon from "react-native-vector-icons/FontAwesome";  

type Unit = {
  status: string;
  unit_id: number;
  unit_name: string;
  image_name?: string;
};

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, "HomeScreen">;

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, route }) => {
  const { username, role } = route.params;
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'HomeScreen',
      headerStyle: { backgroundColor: '#f8f8f8' },
      headerTitleStyle: { fontWeight: 'bold', color: '#023e8a' },
      headerShown: false
    });
  }, [navigation]);

  const fetchUnits = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://192.168.68.56:5000/api/units?username=${username}&role=${role}`);
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No assigned units found");
      }
      setUnits(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [username, role]);

  useEffect(() => {
    fetchUnits();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUnits();
  };

  const handleLogout = () => {
    setLogoutModalVisible(false);
    navigation.replace("LoginScreen"); // Directly navigate to the login screen
  };
  

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#00b4d8" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setLogoutModalVisible(true)} style={styles.userIconContainer}>
          <Icon name="user" size={30} color="#023e8a" style={styles.icon} />
          <Text style={styles.usernameText}>{username}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nirani Sugars</Text>
        <Icon name="bell" size={30} color="#023e8a" style={styles.icon} />
      </View>

      {/* Logout Modal */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>Do you want to log out?</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={() => setLogoutModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Unit List */}
      <FlatList
        contentContainerStyle={styles.flatListContainer}
        data={units}
        keyExtractor={(item) => item.unit_id.toString()}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.unitContainer}
            onPress={() =>
              navigation.navigate("UnitLinesScreen", { unit_id: item.unit_id, unit_name: item.unit_name, role })
            }
          >
            {item.image_name ? (
              <Image
                source={{ uri: `http://192.168.68.56:8080/images/${item.image_name}` }}
                style={styles.unitImage}
              />
            ) : (
              <View style={styles.imagePlaceholder} />
            )}
            <Text style={styles.unitText}>{item.unit_name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No assigned units available.</Text>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#caf0f8" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingHorizontal: 10 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#03045e", textAlign: "center", flex: 1 },
  icon: { padding: 5 },
  userIconContainer: { alignItems: "center" },
  usernameText: { fontSize: 12, color: "#023e8a", marginTop: 5 },
  flatListContainer: { alignItems: "center", justifyContent: "center", width: "100%" },
  unitContainer: { justifyContent: "center", alignItems: "center", margin: 50 },
  unitImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 5, resizeMode: "cover" },
  imagePlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#ccc", marginBottom: 5 },
  unitText: { fontSize: 14, textAlign: "center", color: "#023e8a", width: 80, flexWrap: "wrap" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0096c7" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0077b6" },
  errorText: { fontSize: 18, color: "red", textAlign: "center" },
  emptyText: { fontSize: 16, textAlign: "center", marginTop: 20, color: "gray" },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContainer: { backgroundColor: "white", padding: 20, borderRadius: 10, width: "80%", alignItems: "center" },
  modalText: { fontSize: 18, marginBottom: 20 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  cancelButton: { backgroundColor: "#ccc", padding: 10, flex: 1, alignItems: "center", marginRight: 5, borderRadius: 5 },
  logoutButton: { backgroundColor: "#d9534f", padding: 10, flex: 1, alignItems: "center", marginLeft: 5, borderRadius: 5 },
  buttonText: { color: "white", fontWeight: "bold" },
});

export default HomeScreen;
