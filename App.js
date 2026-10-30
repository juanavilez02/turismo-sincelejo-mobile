import React, { useState } from "react";
import { SafeAreaView, StyleSheet, StatusBar } from "react-native";
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";

export default function App() {
  const [token, setToken] = useState(null);
  const [mostrarLogin, setMostrarLogin] = useState(false);

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="light-content" backgroundColor="#0D9488" />
      {mostrarLogin ? (
        <LoginScreen onLogin={(token) => {
          setToken(token);
          setMostrarLogin(false);
        }} />
      ) : (
        <HomeScreen />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
