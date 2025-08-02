import { View, Text } from 'react-native';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './Screens/Home';
import ContactsScreen from './Screens/Contacts';
import { AuthProvider } from './AuthContex';

type Props = {};

const Stack = createNativeStackNavigator();

const Navigator = (props: Props) => {
  return (
    <NavigationContainer>
      <AuthProvider>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName="Home"
        >
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="Contacts" component={ContactsScreen} />
        </Stack.Navigator>
      </AuthProvider>
    </NavigationContainer>
  );
};

export default Navigator;
