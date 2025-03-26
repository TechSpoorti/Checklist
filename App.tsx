import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './navigation/StackNavigator';

const App: React.FC = () => {
    return (
        <SafeAreaProvider>
            <NavigationContainer>
                <StackNavigator />
            </NavigationContainer>
        </SafeAreaProvider>
    );
};

export default App;
