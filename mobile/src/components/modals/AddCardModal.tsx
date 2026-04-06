import React, { useEffect, useState, useRef } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { apiRequest } from "../../api/client";
import { ModalChrome } from "./ModalChrome";
import { colors, radii, typography } from "../../theme/tokens";
import { parseMoneyInput } from "../../utils/money";

export type EditingCard = {
  id: string;
  name: string;
  bank?: string;
  card_limit: number;
  closing_day: number;
  due_day: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  dashboardId: string | undefined;
  editing?: EditingCard | null;
  onSuccess: () => void;
};

export function AddCardModal({
  visible,
  onClose,
  dashboardId,
  editing = null,
  onSuccess,
}: Props) {
  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [limit, setLimit] = useState("");
  const [closing, setClosing] = useState("");
  const [due, setDue] = useState("");
  const [saving, setSaving] = useState(false);
  const lockRef = useRef(false);

  const isEdit = Boolean(editing?.id);

  useEffect(() => {
    if (!visible) return;
    lockRef.current = false;
    if (editing) {
      setName(editing.name ?? "");
      setBank(editing.bank ?? "");
      setLimit(String(editing.card_limit ?? ""));
      setClosing(String(editing.closing_day ?? ""));
      setDue(String(editing.due_day ?? ""));
    } else {
      setName("");
      setBank("");
      setLimit("");
      setClosing("");
      setDue("");
    }
  }, [visible, editing]);

  const submit = async () => {
    if (lockRef.current || saving) return;
    if (!dashboardId) {
      Alert.alert("Atenção", "Selecione um dashboard.");
      return;
    }
    const lim = parseMoneyInput(limit);
    const cd = parseInt(closing, 10);
    const dd = parseInt(due, 10);
    if (!name.trim() || Number.isNaN(lim) || lim <= 0) {
      Alert.alert("Atenção", "Preencha nome e limite válido.");
      return;
    }
    if (!Number.isInteger(cd) || cd < 1 || cd > 31) {
      Alert.alert("Atenção", "Fechamento deve ser dia 1–31.");
      return;
    }
    if (!Number.isInteger(dd) || dd < 1 || dd > 31) {
      Alert.alert("Atenção", "Vencimento deve ser dia 1–31.");
      return;
    }
    lockRef.current = true;
    setSaving(true);
    try {
      if (isEdit) {
        await apiRequest(`/cards/${editing!.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: name.trim(),
            bank: bank.trim() || null,
            card_limit: lim,
            closing_day: cd,
            due_day: dd,
          }),
        });
      } else {
        await apiRequest("/cards", {
          method: "POST",
          body: JSON.stringify({
            dashboard_id: dashboardId,
            name: name.trim(),
            bank: bank.trim() || undefined,
            card_limit: lim,
            closing_day: cd,
            due_day: dd,
          }),
        });
      }
      onSuccess();
      onClose();
    } catch (e) {
      Alert.alert(
        "Erro",
        e instanceof Error ? e.message : "Não foi possível salvar o cartão.",
      );
    } finally {
      lockRef.current = false;
      setSaving(false);
    }
  };

  return (
    <ModalChrome
      visible={visible}
      title={isEdit ? "Editar cartão" : "Novo cartão"}
      onClose={onClose}
      footer={
        <TouchableOpacity
          style={[styles.primaryBtn, saving && styles.btnDisabled]}
          onPress={submit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>
              {isEdit ? "Salvar" : "Cadastrar"}
            </Text>
          )}
        </TouchableOpacity>
      }
    >
      <Text style={styles.label}>Nome do cartão</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex.: Nubank Gold"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />
      <Text style={styles.label}>Banco (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex.: Nubank"
        placeholderTextColor={colors.textMuted}
        value={bank}
        onChangeText={setBank}
      />
      <Text style={styles.label}>Limite (R$)</Text>
      <TextInput
        style={styles.input}
        placeholder="0,00"
        keyboardType="decimal-pad"
        placeholderTextColor={colors.textMuted}
        value={limit}
        onChangeText={setLimit}
      />
      <Text style={styles.label}>Dia fechamento (1–31)</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={closing}
        onChangeText={setClosing}
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.label}>Dia vencimento (1–31)</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={due}
        onChangeText={setDue}
        placeholderTextColor={colors.textMuted}
      />
    </ModalChrome>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.caption, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    padding: 16,
    alignItems: "center",
    marginBottom: 8,
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
