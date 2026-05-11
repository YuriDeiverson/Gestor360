import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { FinanceiroPlusLogo } from "../components/FinanceiroPlusLogo";
import type { RootStackParamList } from "../navigation/types";
import { colors, radii, typography } from "../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Atenção", "Preencha email e senha.");
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      Alert.alert(
        "Erro ao entrar",
        e instanceof Error ? e.message : "Tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.hero}>
          <View style={styles.logoMark}>
            <FinanceiroPlusLogo size={34} color={colors.primary} />
          </View>
          <Text style={styles.brandTitle}>Financeiro +</Text>
          <Text style={styles.title}>Entrar</Text>
          <Text style={styles.subtitle}>
            Acesse com a mesma conta do site.
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={submitting}
          activeOpacity={0.9}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continuar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.link}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.linkText}>Criar conta</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    padding: 20,
    /* Safe areas para dispositivos modernos */
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
  inner: { 
    width: "100%", 
    maxWidth: 400, 
    alignSelf: "center",
    /* Garantir espaçamento seguro */
    paddingHorizontal: Platform.OS === 'ios' ? 0 : 16,
  },
  hero: { marginBottom: 32 },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.35)",
    marginBottom: 16,
    /* Sombra sutil para destaque */
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  title: { ...typography.hero, marginBottom: 8 },
  subtitle: { ...typography.subtitle },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    /* Melhor feedback visual */
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    padding: 17,
    alignItems: "center",
    marginTop: 8,
    /* Melhor feedback tátil */
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: { 
    opacity: 0.65,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "700" 
  },
  link: { 
    marginTop: 22, 
    alignItems: "center",
    /* Área de toque maior */
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  linkText: { 
    color: colors.primary, 
    fontSize: 15, 
    fontWeight: "600" 
  },
});
