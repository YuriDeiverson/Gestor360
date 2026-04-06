import React, { useEffect, useState, useRef } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  View,
} from "react-native";
import { apiRequest } from "../../api/client";
import { ModalChrome } from "./ModalChrome";
import { colors, radii, typography } from "../../theme/tokens";
import { parseMoneyInput } from "../../utils/money";

export type EditingBudget = {
  id: string;
  nome?: string;
  name?: string;
  tipo?: string;
  limit_value?: number;
  limitValue?: number;
  descricao?: string;
  icone?: string;
  cor?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  dashboardId: string | undefined;
  editing?: EditingBudget | null;
  onSuccess: () => void;
};

export function AddBudgetModal({
  visible,
  onClose,
  dashboardId,
  editing = null,
  onSuccess,
}: Props) {
  const [nome, setNome] = useState("");
  const [limit, setLimit] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<"income" | "expense">("expense");
  const [saving, setSaving] = useState(false);
  const lockRef = useRef(false);

  const isEdit = Boolean(editing?.id);

  useEffect(() => {
    if (!visible) return;
    lockRef.current = false;
    if (editing) {
      setNome(editing.nome ?? editing.name ?? "");
      const cap = Number(editing.limit_value ?? editing.limitValue ?? 0);
      setLimit(cap > 0 ? String(cap) : "");
      setDescricao(editing.descricao ?? "");
      const tr = (editing.tipo ?? "").toLowerCase();
      setTipo(
        tr === "income" || tr === "receita" ? "income" : "expense",
      );
    } else {
      setNome("");
      setLimit("");
      setDescricao("");
      setTipo("expense");
    }
  }, [visible, editing]);

  const submit = async () => {
    if (lockRef.current || saving) return;
    if (!dashboardId) {
      Alert.alert("Atenção", "Selecione um dashboard.");
      return;
    }
    const lim = parseMoneyInput(limit);
    if (!nome.trim() || Number.isNaN(lim) || lim <= 0) {
      Alert.alert("Atenção", "Preencha nome e limite válido.");
      return;
    }
    lockRef.current = true;
    setSaving(true);
    try {
      const icone = editing?.icone ?? "💰";
      const cor =
        editing?.cor ??
        (tipo === "income" ? "#34d399" : "#3b82f6");
      if (isEdit) {
        await apiRequest(`/budgets/${editing!.id}`, {
          method: "PUT",
          body: JSON.stringify({
            nome: nome.trim(),
            tipo,
            limit_value: lim,
            descricao: descricao.trim() || "",
            icone,
            cor,
          }),
        });
      } else {
        await apiRequest("/budgets", {
          method: "POST",
          body: JSON.stringify({
            nome: nome.trim(),
            tipo,
            limit_value: lim,
            descricao: descricao.trim() || "",
            icone,
            cor,
            dashboard_id: dashboardId,
          }),
        });
      }
      onSuccess();
      onClose();
    } catch (e) {
      Alert.alert(
        "Erro",
        e instanceof Error ? e.message : "Não foi possível salvar o orçamento.",
      );
    } finally {
      lockRef.current = false;
      setSaving(false);
    }
  };

  return (
    <ModalChrome
      visible={visible}
      title={isEdit ? "Editar orçamento" : "Nova categoria"}
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
      <Text style={styles.label}>Tipo</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.typeBtn, tipo === "expense" && styles.typeOn]}
          onPress={() => setTipo("expense")}
        >
          <Text style={[styles.typeTxt, tipo === "expense" && styles.typeTxtOn]}>
            Despesa
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, tipo === "income" && styles.typeOn]}
          onPress={() => setTipo("income")}
        >
          <Text style={[styles.typeTxt, tipo === "income" && styles.typeTxtOn]}>
            Receita
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Nome</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex.: Alimentação"
        placeholderTextColor={colors.textMuted}
        value={nome}
        onChangeText={setNome}
      />

      <Text style={styles.label}>Limite mensal (R$)</Text>
      <TextInput
        style={styles.input}
        placeholder="0,00"
        keyboardType="decimal-pad"
        placeholderTextColor={colors.textMuted}
        value={limit}
        onChangeText={setLimit}
      />

      <Text style={styles.label}>Descrição (opcional)</Text>
      <TextInput
        style={[styles.input, styles.tall]}
        placeholder="Notas"
        placeholderTextColor={colors.textMuted}
        value={descricao}
        onChangeText={setDescricao}
        multiline
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
  tall: { minHeight: 72, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10, marginBottom: 4 },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  typeOn: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  typeTxt: { color: colors.textSecondary, fontWeight: "700" },
  typeTxtOn: { color: colors.primary },
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
