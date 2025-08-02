
import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import Navigator from './src/Navigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
   <Navigator/>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
