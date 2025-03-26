import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import ModalSelector from 'react-native-modal-selector';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/StackNavigator';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'LoginScreen'>;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(''); // No default role

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter username and password.');
            return;
        }
        if (!role) {
            Alert.alert('Error', 'Please select a role.');
            return;
        }

        try {
            const response = await fetch('http://192.168.68.56:5000/api/login', {
                                         
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role }),
            });

            const data = await response.json();

            if (response.ok) {
                navigation.navigate('HomeScreen', { username, role });
            } else {
                Alert.alert('Login Failed', data.message || 'Invalid username, password, or role');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'An error occurred while logging in. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Login</Text>
            <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                secureTextEntry
                onChangeText={setPassword}
            />

            <Text style={styles.label}>Select Role:</Text>
            <ModalSelector
                data={[
                    {key:'inspector',label:'Inspector'},
                    {key:'inspector2',label:'Inspector2'},
                    { key: 'manager', label: 'Manager' },
                    { key: 'approver1', label: 'Approver 1' },
                    { key: 'approver2', label: 'Approver 2' },
                    { key: 'approver3', label: 'Approver 3' },
                    { key: 'approver4', label: 'Approver 4' },
                    { key: 'approver5', label: 'Approver 5' },
                ]}
                 initValue={role ? role : "Select Role"}  // Ensure selected value persists
    onChange={(option) => setRole(option.key)}  // Ensure you set the label, not key
    style={styles.picker}
            />
            <Button title="Login" onPress={handleLogin} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { height: 50, borderWidth: 1, borderColor: '#ccc', marginBottom: 15, paddingLeft: 10 },
    label: { fontSize: 16, marginBottom: 5, fontWeight: 'bold' ,color:'black'},
    picker: { height: 50, marginBottom: 20 },
});

export default LoginScreen;
