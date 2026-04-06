import React, { useEffect, useMemo, useState, useRef } from "react";
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

export type BudgetOpt = {
  id: string;
  nome?: string;
  name?: string;
  tipo?: string;
};

export type CardOpt = { id: string; name: string };

/** Linha da API para edição (snake_case). */
export type EditingTransaction = {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  tipo: string;
  budget_id?: string | null;
  categoria?: string;
  method?: string;
  account?: string;
  status?: string;
  installments?: number;
  currentinstallment?: number;
  totalamount?: number;
  remainingamount?: number;
  nextpaymentdate?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  dashboardId: string | undefined;
  tipo: "receita" | "despesa";
  budgets: BudgetOpt[];
  cards?: CardOpt[];
  /** Se definido, modo edição (PUT). */
  editing?: EditingTransaction | null;
  onSuccess: () => void;
};

const methodsExpense = ["PIX", "Cartão de Crédito", "Débito"] as const;

function addOneMonth(iso: string): string {
  const d = new Date(iso.split("T")[0] + "T12:00:00");
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0];
}

export function AddTransactionModal({
  visible,
  onClose,
  dashboardId,
  tipo,
  budgets,
  cards = [],
  editing = null,
  onSuccess,
}: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(today);
  const [account, setAccount] = useState("Conta Principal");
  const [method, setMethod] = useState<string>("PIX");
  const [budgetId, setBudgetId] = useState<string | null>(null);
  const [categoria, setCategoria] = useState("Salário");
  const [parcelas, setParcelas] = useState("1");
  const [saving, setSaving] = useState(false);
  const lockRef = useRef(false);

  const expenseBudgets = useMemo(
    () =>
      budgets.filter((b) => {
        const t = (b.tipo ?? "").toLowerCase();
        return t === "expense" || t === "despesa";
      }),
    [budgets],
  );

  const isEdit = Boolean(editing?.id);
  const nParcelas = Math.max(
    1,
    Math.min(48, parseInt(parcelas || "1", 10) || 1),
  );

  useEffect(() => {
    if (!visible) return;
    lockRef.current = false;
    if (editing) {
      setDescricao(editing.descricao ?? "");
      setValor(
        editing.valor != null && !Number.isNaN(Number(editing.valor))
          ? String(editing.valor)
          : "",
      );
      setData((editing.data || today).split("T")[0]);
      setAccount(editing.account?.trim() || "Conta Principal");
      setMethod(
        editing.method && editing.tipo === "despesa"
          ? editing.method
          : tipo === "receita"
            ? "Salário"
            : "PIX",
      );
      setBudgetId(editing.budget_id ?? null);
      setCategoria(editing.categoria?.trim() || "Outros");
      setParcelas(
        editing.installments && editing.installments > 1
          ? String(editing.installments)
          : "1",
      );
    } else {
      setDescricao("");
      setValor("");
      setData(new Date().toISOString().split("T")[0]);
      setAccount("Conta Principal");
      setMethod(tipo === "receita" ? "Salário" : "PIX");
      setBudgetId(
        tipo === "despesa" ? expenseBudgets[0]?.id ?? null : null,
      );
      setCategoria("Salário");
      setParcelas("1");
    }
  }, [visible, editing, tipo, today, expenseBudgets]);

  const submit = async () => {
    if (lockRef.current || saving) return;
    if (!dashboardId) {
      Alert.alert("Atenção", "Selecione um dashboard.");
      return;
    }
    const v = parseMoneyInput(valor);
    if (!descricao.trim() || Number.isNaN(v) || v <= 0) {
      Alert.alert("Atenção", "Preencha descrição e valor válido.");
      return;
    }
    if (tipo === "despesa" && !budgetId) {
      Alert.alert("Atenção", "Escolha uma categoria de orçamento.");
      return;
    }
    if (tipo === "receita" && !account.trim()) {
      Alert.alert("Atenção", "Informe a conta.");
      return;
    }

    const useCardPicker =
      tipo === "despesa" &&
      method === "Cartão de Crédito" &&
      cards.length > 0;
    if (useCardPicker && !account) {
      Alert.alert("Atenção", "Selecione o cartão.");
      return;
    }
    if (
      tipo === "despesa" &&
      nParcelas > 1 &&
      method !== "Cartão de Crédito"
    ) {
      Alert.alert(
        "Atenção",
        "Parcelamento no cartão: escolha Cartão de crédito e selecione o cartão.",
      );
      return;
    }

    lockRef.current = true;
    setSaving(true);
    try {
      const inst = isEdit
        ? Math.max(1, editing!.installments ?? 1)
        : nParcelas;
      const curInst = isEdit
        ? Math.max(1, editing!.currentinstallment ?? 1)
        : 1;

      const baseBody: Record<string, unknown> = {
        dashboard_id: dashboardId,
        descricao: descricao.trim(),
        valor: v,
        tipo,
        data,
        account: (useCardPicker ? account : account.trim()) || "Conta Principal",
      };

      if (tipo === "receita") {
        baseBody.method = "Salário";
        baseBody.budget_id = null;
        baseBody.categoria = categoria.trim() || "Outros";
        baseBody.status = editing?.status ?? "completed";
      } else {
        baseBody.method = method;
        baseBody.budget_id = budgetId;
        if (inst > 1) {
          const totalAmt = isEdit
            ? Number(editing!.totalamount) > 0
              ? Number(editing!.totalamount)
              : v * inst
            : v * inst;
          const prevV = isEdit ? Number(editing!.valor) || v : v;
          baseBody.installments = inst;
          baseBody.currentinstallment = curInst;
          baseBody.totalamount = totalAmt;
          if (isEdit) {
            baseBody.remainingamount = Math.max(
              0,
              Number(editing!.remainingamount ?? 0) - (v - prevV),
            );
            baseBody.nextpaymentdate = editing!.nextpaymentdate;
          } else {
            baseBody.remainingamount = totalAmt - v;
            baseBody.nextpaymentdate = addOneMonth(data);
          }
          baseBody.status = editing?.status ?? "pending";
        } else {
          baseBody.status = editing?.status ?? "completed";
        }
      }

      if (isEdit) {
        await apiRequest(`/transacoes/${editing!.id}`, {
          method: "PUT",
          body: JSON.stringify(baseBody),
        });
      } else {
        await apiRequest("/transacoes", {
          method: "POST",
          body: JSON.stringify(baseBody),
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

  const title = isEdit
    ? tipo === "receita"
      ? "Editar receita"
      : "Editar despesa"
    : tipo === "receita"
      ? "Nova receita"
      : "Nova despesa";

  const showParcelas =
    tipo === "despesa" && method === "Cartão de Crédito" && !isEdit;

  return (
    <ModalChrome
      visible={visible}
      title={title}
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
              {isEdit ? "Salvar alterações" : "Salvar"}
            </Text>
          )}
        </TouchableOpacity>
      }
    >
      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex.: Salário, Mercado…"
        placeholderTextColor={colors.textMuted}
        value={descricao}
        onChangeText={setDescricao}
      />

      <Text style={styles.label}>Valor (R$)</Text>
      <TextInput
        style={styles.input}
        placeholder="0,00"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
        value={valor}
        onChangeText={setValor}
      />
      {isEdit &&
      editing &&
      (editing.installments ?? 1) > 1 ? (
        <Text style={styles.hint}>
          Valor exibido é o da parcela. Parcela atual:{" "}
          {editing.currentinstallment ?? 1}/{editing.installments}.
        </Text>
      ) : null}

      <Text style={styles.label}>Data (AAAA-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={data}
        onChangeText={setData}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
      />

      {tipo === "receita" ? (
        <>
          <Text style={styles.label}>Categoria</Text>
          <TextInput
            style={styles.input}
            value={categoria}
            onChangeText={setCategoria}
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.label}>Conta</Text>
          <TextInput
            style={styles.input}
            value={account}
            onChangeText={setAccount}
            placeholderTextColor={colors.textMuted}
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>Categoria (orçamento)</Text>
          <View style={styles.chips}>
            {expenseBudgets.map((b) => {
              const label = b.nome ?? b.name ?? "Categoria";
              const active = budgetId === b.id;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.chip, active && styles.chipOn]}
                  onPress={() => setBudgetId(b.id)}
                >
                  <Text style={[styles.chipTxt, active && styles.chipTxtOn]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {expenseBudgets.length === 0 ? (
            <Text style={styles.hint}>
              Crie um orçamento de despesa em Mais → Orçamento.
            </Text>
          ) : null}

          <Text style={styles.label}>Forma de pagamento</Text>
          <View style={styles.chips}>
            {methodsExpense.map((m) => {
              const active = method === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.chip, active && styles.chipOn]}
                  onPress={() => setMethod(m)}
                >
                  <Text style={[styles.chipTxt, active && styles.chipTxtOn]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {method === "Cartão de Crédito" && cards.length > 0 ? (
            <>
              <Text style={styles.label}>Cartão</Text>
              <View style={styles.chips}>
                {cards.map((c) => {
                  const active = account === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.chip, active && styles.chipOn]}
                      onPress={() => setAccount(c.id)}
                    >
                      <Text
                        style={[styles.chipTxt, active && styles.chipTxtOn]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.label}>Conta</Text>
              <TextInput
                style={styles.input}
                value={account}
                onChangeText={setAccount}
                placeholderTextColor={colors.textMuted}
              />
            </>
          )}

          {showParcelas ? (
            <>
              <Text style={styles.label}>Parcelas</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={parcelas}
                onChangeText={setParcelas}
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.hint}>
                Valor acima é por parcela. 1x = à vista concluída.
              </Text>
            </>
          ) : null}
        </>
      )}
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
  hint: { ...typography.caption, marginTop: 8, color: colors.textMuted },
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
