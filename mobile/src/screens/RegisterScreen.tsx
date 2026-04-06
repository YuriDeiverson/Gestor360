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

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Atenção", "Preencha nome, email e senha.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Atenção", "A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setSubmitting(true);
    try {
      await register(email.trim(), password, name.trim());
    } catch (e) {
      Alert.alert(
        "Erro ao registrar",
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
            <FinanceiroPlusLogo size={34} color={colors.success} />
          </View>
          <Text style={styles.brandTitle}>Financeiro +</Text>
          <Text style={styles.title}>Nova conta</Text>
          <Text style={styles.subtitle}>
            Mesma conta do aplicativo web Financeiro +.
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Nome"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha (mín. 6 caracteres)"
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
            <Text style={styles.buttonText}>Cadastrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.link}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.linkText}>Já tenho conta</Text>
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
    padding: 24,
  },
  inner: { width: "100%", maxWidth: 400, alignSelf: "center" },
  hero: { marginBottom: 28 },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: "rgba(52, 211, 153, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.35)",
    marginBottom: 16,
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
  },
  button: {
    backgroundColor: colors.success,
    borderRadius: radii.md,
    padding: 17,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  link: { marginTop: 22, alignItems: "center" },
  linkText: { color: colors.primary, fontSize: 15, fontWeight: "600" },
});
