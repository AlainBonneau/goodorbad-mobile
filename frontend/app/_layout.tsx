import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import GameScreen from '../src/screens/GameScreen';


export default function RootLayout() {
return (
<SafeAreaView style={{ flex: 1 }}>
<StatusBar barStyle="dark-content" />
<GameScreen />
</SafeAreaView>
);
}