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

export type EditingGoal = {
  id: string;
  nome: string;
  valor_alvo: number;
  valor_atual?: number;
  data_limite?: string;
  descricao?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  dashboardId: string | undefined;
  editing?: EditingGoal | null;
  onSuccess: () => void;
};

export function AddGoalModal({
  visible,
  onClose,
  dashboardId,
  editing = null,
  onSuccess,
}: Props) {
  const [nome, setNome] = useState("");
  const [alvo, setAlvo] = useState("");
  const [atual, setAtual] = useState("0");
  const [limite, setLimite] = useState("");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);
  const lockRef = useRef(false);

  const isEdit = Boolean(editing?.id);

  useEffect(() => {
    if (!visible) return;
    lockRef.current = false;
    if (editing) {
      setNome(editing.nome ?? "");
      setAlvo(String(editing.valor_alvo ?? ""));
      setAtual(String(editing.valor_atual ?? 0));
      setLimite((editing.data_limite ?? "").split("T")[0]);
      setDescricao(editing.descricao ?? "");
    } else {
      setNome("");
      setAlvo("");
      setAtual("0");
      setLimite("");
      setDescricao("");
    }
  }, [visible, editing]);

  const submit = async () => {
    if (lockRef.current || saving) return;
    if (!dashboardId) {
      Alert.alert("Atenção", "Selecione um dashboard.");
      return;
    }
    const va = parseMoneyInput(alvo);
    const vc = parseMoneyInput(atual);
    if (!nome.trim() || Number.isNaN(va) || va <= 0) {
      Alert.alert("Atenção", "Preencha nome e valor alvo.");
      return;
    }
    if (!limite.trim()) {
      Alert.alert("Atenção", "Informe a data limite (AAAA-MM-DD).");
      return;
    }
    lockRef.current = true;
    setSaving(true);
    try {
      const body = {
        nome: nome.trim(),
        valor_alvo: va,
        valor_atual: Number.isNaN(vc) ? 0 : Math.max(0, vc),
        data_limite: limite.trim(),
        descricao: descricao.trim() || "",
        ...(isEdit ? {} : { dashboard_id: dashboardId }),
      };
      if (isEdit) {
        await apiRequest(`/metas/${editing!.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await apiRequest("/metas", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      onSuccess();
      onClose();
    } catch (e) {
      Alert.alert(
        "Erro",
        e instanceof Error ? e.message : "Não foi possível salvar a meta.",
      );
    } finally {
      lockRef.current = false;
      setSaving(false);
    }
  };

  return (
    <ModalChrome
      visible={visible}
      title={isEdit ? "Editar meta" : "Nova meta"}
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
      <Text style={styles.label}>Nome</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex.: Viagem"
        placeholderTextColor={colors.textMuted}
        value={nome}
        onChangeText={setNome}
      />

      <Text style={styles.label}>Valor alvo (R$)</Text>
      <TextInput
        style={styles.input}
        placeholder="0,00"
        keyboardType="decimal-pad"
        placeholderTextColor={colors.textMuted}
        value={alvo}
        onChangeText={setAlvo}
      />

      <Text style={styles.label}>Valor atual (R$)</Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        keyboardType="decimal-pad"
        placeholderTextColor={colors.textMuted}
        value={atual}
        onChangeText={setAtual}
      />

      <Text style={styles.label}>Data limite (AAAA-MM-DD)</Text>
      <TextInput
        style={styles.input}
        placeholder="2026-12-31"
        placeholderTextColor={colors.textMuted}
        value={limite}
        onChangeText={setLimite}
        autoCapitalize="none"
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
