import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
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

type CardOpt = { id: string; name: string };

export type EditingSubscription = {
  id: string;
  name: string;
  amount: number;
  billing_day?: number;
  card_id?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  dashboardId: string | undefined;
  editing?: EditingSubscription | null;
  onSuccess: () => void;
};

export function AddSubscriptionModal({
  visible,
  onClose,
  dashboardId,
  editing = null,
  onSuccess,
}: Props) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("");
  const [cards, setCards] = useState<CardOpt[]>([]);
  const [cardId, setCardId] = useState<string | null>(null);
  const [loadingCards, setLoadingCards] = useState(false);
  const [saving, setSaving] = useState(false);
  const lockRef = useRef(false);

  const isEdit = Boolean(editing?.id);

  const loadCards = useCallback(async () => {
    if (!dashboardId) {
      setCards([]);
      return;
    }
    setLoadingCards(true);
    try {
      const data = await apiRequest<Array<{ id: string; name: string }>>(
        `/cards?dashboard_id=${dashboardId}`,
      );
      const list = Array.isArray(data) ? data : [];
      setCards(list.map((c) => ({ id: c.id, name: c.name })));
      if (!isEdit) {
        setCardId(list[0]?.id ?? null);
      }
    } catch {
      setCards([]);
      if (!isEdit) setCardId(null);
    } finally {
      setLoadingCards(false);
    }
  }, [dashboardId, isEdit]);

  useEffect(() => {
    if (!visible) return;
    lockRef.current = false;
    if (editing) {
      setName(editing.name ?? "");
      setAmount(String(editing.amount ?? ""));
      setDay(
        editing.billing_day != null ? String(editing.billing_day) : "",
      );
      setCardId(editing.card_id ?? null);
    } else {
      setName("");
      setAmount("");
      setDay("");
      setCardId(null);
    }
    loadCards();
  }, [visible, editing, loadCards]);

  useEffect(() => {
    if (!visible || !editing?.card_id || loadingCards) return;
    const id = editing.card_id;
    if (cards.some((c) => c.id === id)) setCardId(id);
  }, [visible, editing?.card_id, loadingCards, cards]);

  const submit = async () => {
    if (lockRef.current || saving) return;
    if (!dashboardId) {
      Alert.alert("Atenção", "Selecione um dashboard.");
      return;
    }
    const amt = parseMoneyInput(amount);
    const d = parseInt(day, 10);
    if (!name.trim() || Number.isNaN(amt) || amt <= 0) {
      Alert.alert("Atenção", "Preencha nome e valor.");
      return;
    }
    if (!Number.isInteger(d) || d < 1 || d > 31) {
      Alert.alert("Atenção", "Dia de cobrança deve ser 1–31.");
      return;
    }
    if (!cardId) {
      Alert.alert(
        "Atenção",
        "Cadastre um cartão antes de adicionar assinatura.",
      );
      return;
    }
    lockRef.current = true;
    setSaving(true);
    try {
      if (isEdit) {
        await apiRequest(`/subscriptions/${editing!.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: name.trim(),
            amount: amt,
            billing_day: d,
            card_id: cardId,
          }),
        });
      } else {
        await apiRequest("/subscriptions", {
          method: "POST",
          body: JSON.stringify({
            dashboard_id: dashboardId,
            card_id: cardId,
            name: name.trim(),
            amount: amt,
            billing_day: d,
          }),
        });
      }
      onSuccess();
      onClose();
    } catch (e) {
      Alert.alert(
        "Erro",
        e instanceof Error ? e.message : "Não foi possível salvar.",
      );
    } finally {
      lockRef.current = false;
      setSaving(false);
    }
  };

  return (
    <ModalChrome
      visible={visible}
      title={isEdit ? "Editar assinatura" : "Nova assinatura"}
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
      {loadingCards ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
      ) : null}

      <Text style={styles.label}>Cartão</Text>
      <View style={styles.chips}>
        {cards.map((c) => {
          const active = cardId === c.id;
          return (
            <TouchableOpacity
              key={c.id}
              style={[styles.chip, active && styles.chipOn]}
              onPress={() => setCardId(c.id)}
            >
              <Text style={[styles.chipTxt, active && styles.chipTxtOn]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {cards.length === 0 && !loadingCards ? (
        <Text style={styles.hint}>
          Cadastre um cartão na aba Cartões primeiro.
        </Text>
      ) : null}

      <Text style={styles.label}>Nome</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex.: Netflix"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Valor mensal (R$)</Text>
      <TextInput
        style={styles.input}
        placeholder="0,00"
        keyboardType="decimal-pad"
        placeholderTextColor={colors.textMuted}
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Dia da cobrança (1–31)</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        placeholderTextColor={colors.textMuted}
        value={day}
        onChangeText={setDay}
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
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  chipTxt: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  chipTxtOn: { color: colors.primary },
  hint: { ...typography.caption, marginBottom: 8, color: colors.warning },
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
