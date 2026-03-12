import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://coxkpkvrypegppbpboyl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNveGtwa3ZyeXBlZ3BwYnBib3lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMDQ0MTksImV4cCI6MjA4ODg4MDQxOX0.IaHzADVuIyjeBpay1TsHund1sOp4HCQ-1P7ZWsibntU"
);

const CHECKLIST = [
  { id: 1, category: "Identificação", icon: "👤", items: ["CPF e RG", "Título de eleitor", "Endereço completo atualizado", "Data de nascimento e naturalidade"] },
  { id: 2, category: "Rendimentos", icon: "💼", items: ["Informe de rendimentos do empregador (DIRF)", "Comprovante de pró-labore (se sócio)", "Recibos de aluguéis recebidos", "Extratos bancários com rendimentos de investimentos"] },
  { id: 3, category: "Bens e Direitos", icon: "🏠", items: ["Escritura ou contrato de imóveis", "Documento de veículos (CRLV)", "Extratos de contas bancárias e investimentos (31/12)", "Contrato de participação societária"] },
  { id: 4, category: "Deduções", icon: "📋", items: ["Recibos de plano de saúde (titular e dependentes)", "Notas fiscais de médicos, dentistas, psicólogos", "Comprovante de pagamento de escola/faculdade", "PGBL/VGBL – informe da seguradora"] },
  { id: 5, category: "Dependentes", icon: "👨‍👩‍👧", items: ["CPF dos dependentes", "Certidão de nascimento dos filhos", "Comprovante de guarda/tutela, se aplicável"] },
  { id: 6, category: "Dívidas e Ônus", icon: "📄", items: ["Contratos de financiamento imobiliário", "Empréstimos bancários com saldo devedor"] },
];

const STATUS_STEPS = ["Aguardando Documentos", "Em Análise", "Em Elaboração", "Revisão Final", "Entregue"];

export default function App() {
  const [screen, setScreen] = useState("home");
  const [cliente, setCliente] = useState(null);
  const [declaracoes, setDeclaracoes] = useState([]);
  const [activeDeclaracao, setActiveDeclaracao] = useState(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", cpf: "", email: "", phone: "", year: "2025" });
  const [loginData, setLoginData] = useState({ cpf: "", email: "" });
  const [checkedDocs, setCheckedDocs] = useState({});
  const [pixCopied, setPixCopied] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [otherDocsNote, setOtherDocsNote] = useState("");
  const [initialObs, setInitialObs] = useState("");
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [pixReceipt, setPixReceiptFile] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [msgFiles, setMsgFiles] = useState([]);
  const [trackingTab, setTrackingTab] = useState("status");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const totalChecked = Object.values(checkedDocs).filter(Boolean).length;
  const totalItems = CHECKLIST.reduce((a, c) => a + c.items.length, 0);

  useEffect(() => {
    const saved = localStorage.getItem("declarafacil_cliente");
    if (saved) setCliente(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (cliente) carregarDeclaracoes();
  }, [cliente]);

  useEffect(() => {
    if (activeDeclaracao) carregarMensagens(activeDeclaracao.id);
  }, [activeDeclaracao]);

  async function carregarDeclaracoes() {
    const { data } = await supabase
      .from("declaracoes")
      .select("*")
      .eq("cliente_id", cliente.id)
      .order("criado_em", { ascending: false });
    if (data) setDeclaracoes(data);
  }

  async function carregarMensagens(declaracaoId) {
    const { data } = await supabase
      .from("mensagens")
      .select("*")
      .eq("declaracao_id", declaracaoId)
      .order("criado_em", { ascending: true });
    if (data) setMessages(data);
  }

  async function handleLogin() {
    setLoading(true);
    setErro("");
    const cpfLimpo = loginData.cpf.replace(/\D/g, "");
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("cpf", cpfLimpo)
      .eq("email", loginData.email.toLowerCase().trim())
      .single();
    if (error || !data) {
      setErro("CPF ou e-mail não encontrado. Verifique os dados ou inicie uma nova declaração.");
    } else {
      setCliente(data);
      localStorage.setItem("declarafacil_cliente", JSON.stringify(data));
      setScreen("orders");
    }
    setLoading(false);
  }

  function handleLogout() {
    setCliente(null);
    localStorage.removeItem("declarafacil_cliente");
    setScreen("home");
  }

  async function salvarDeclaracao() {
    setLoading(true);
    try {
      const cpfLimpo = formData.cpf.replace(/\D/g, "");
      // Criar ou buscar cliente
      let clienteData;
      const { data: existente } = await supabase
        .from("clientes")
        .select("*")
        .eq("cpf", cpfLimpo)
        .single();

      if (existente) {
        clienteData = existente;
      } else {
        const { data: novo, error } = await supabase
          .from("clientes")
          .insert({ nome: formData.name, cpf: cpfLimpo, email: formData.email.toLowerCase().trim(), whatsapp: formData.phone })
          .select()
          .single();
        if (error) throw error;
        clienteData = novo;
      }

      // Criar declaração
      const { data: decl, error: declErr } = await supabase
        .from("declaracoes")
        .insert({
          cliente_id: clienteData.id,
          ano_base: formData.year,
          status: 0,
          valor: "R$ 120,00",
          observacoes: initialObs,
          outros_docs: otherDocsNote,
          pix_confirmado: false,
        })
        .select()
        .single();
      if (declErr) throw declErr;

      // Salvar mensagem inicial se tiver observação
      if (initialObs.trim()) {
        await supabase.from("mensagens").insert({
          declaracao_id: decl.id,
          remetente: "cliente",
          nome_remetente: clienteData.nome,
          texto: `📝 Observação inicial: ${initialObs}`,
        });
      }

      setCliente(clienteData);
      localStorage.setItem("declarafacil_cliente", JSON.stringify(clienteData));
      await carregarDeclaracoes();
      setScreen("orders");
    } catch (e) {
      setErro("Erro ao salvar. Tente novamente.");
    }
    setLoading(false);
  }

  async function enviarMensagem() {
    if (!newMessage.trim() && msgFiles.length === 0) return;
    const { data } = await supabase
      .from("mensagens")
      .insert({
        declaracao_id: activeDeclaracao.id,
        remetente: "cliente",
        nome_remetente: cliente.nome,
        texto: newMessage.trim(),
      })
      .select()
      .single();
    if (data) setMessages(prev => [...prev, data]);
    setNewMessage("");
    setMsgFiles([]);
  }

  function copyPix() {
    navigator.clipboard.writeText("05467514660").catch(() => {});
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  }

  function toggleDoc(key) { setCheckedDocs(prev => ({ ...prev, [key]: !prev[key] })); }

  const StatusBadge = ({ s }) => {
    const colors = ["#F59E0B", "#3B82F6", "#8B5CF6", "#EC4899", "#10B981"];
    return (
      <span style={{ background: colors[s] + "20", color: colors[s], padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>
        {STATUS_STEPS[s]}
      </span>
    );
  };

  const Input = ({ label, value, onChange, type = "text", placeholder }) => (
    <div style={{ marginBottom: 18 }}>
      <label style={{ fontSize: 13, color: "#9CA3AF", display: "block", marginBottom: 6 }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{ width: "100%", background: "#161B22", border: "1px solid #2D3748", color: "#F0EDE8", padding: "12px 14px", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box" }} />
    </div>
  );

  // HOME
  if (screen === "home") return (
    <div style={{ minHeight: "100vh", background: "#0D1117", fontFamily: "'Georgia', serif", color: "#F0EDE8" }}>
      <div style={{ padding: "20px 28px", borderBottom: "1px solid #1E2732", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#00C896", letterSpacing: "-0.5px" }}>📊 DeclaraFácil</div>
          <div style={{ fontSize: 11, color: "#6B7280", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>Imposto de Renda Simplificado</div>
        </div>
        <button onClick={() => setScreen("login")} style={{ background: "transparent", border: "1px solid #2D3748", color: "#9CA3AF", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
          Já sou cliente
        </button>
      </div>

      <div style={{ padding: "60px 28px 40px", maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "#00C89615", border: "1px solid #00C89630", color: "#00C896", padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 24, letterSpacing: 1 }}>
          ✦ PRAZO 2026 ABERTO
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.15, margin: "0 0 16px", letterSpacing: "-1px" }}>
          Sua declaração do IR <span style={{ color: "#00C896" }}>do jeito certo</span>
        </h1>
        <p style={{ color: "#9CA3AF", fontSize: 16, lineHeight: 1.7, marginBottom: 36 }}>
          Preencha seus dados, envie os documentos e receba sua declaração pronta. Simples, seguro e rápido.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 36 }}>
          {[["📤", "Envie seus docs"], ["⚡", "Fazemos tudo"], ["📩", "Receba pronto"]].map(([ic, lb]) => (
            <div key={lb} style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: 12, padding: "16px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{ic}</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.4 }}>{lb}</div>
            </div>
          ))}
        </div>
        <button onClick={() => { setScreen("new"); setStep(1); }} style={{ width: "100%", background: "linear-gradient(135deg, #00C896, #00A37A)", border: "none", color: "#0D1117", padding: "16px", borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
          Iniciar Declaração →
        </button>
        <div style={{ marginTop: 12, fontSize: 13, color: "#4B5563" }}>A partir de R$ 120,00 · Pagamento via PIX</div>
      </div>

      {/* IR 2026 RULES */}
      <div style={{ padding: "0 28px 40px", maxWidth: 520, margin: "0 auto" }}>
        <div style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: 16, padding: 24, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 20 }}>📌</span>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#F0EDE8", textTransform: "uppercase", letterSpacing: 1 }}>Quem deve declarar IR 2026?</div>
          </div>
          <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 16 }}>Ano-base 2025 · Prazo estimado: 16 mar a 29 mai de 2026</div>
          {[
            ["💰", "Rendimentos tributáveis acima de R$ 33.888,00", "Salários, aposentadoria, pensões, aluguéis recebidos em 2025"],
            ["🏦", "Rendimentos isentos acima de R$ 200.000,00", "FGTS, indenizações, dividendos ou lucros distribuídos"],
            ["🏠", "Patrimônio acima de R$ 800.000,00", "Bens e direitos possuídos em 31/12/2025"],
            ["📈", "Operações na bolsa acima de R$ 40.000,00", "Ações, fundos, day trade ou ganho líquido tributável"],
            ["💸", "Ganho de capital", "Lucro na venda de imóveis, veículos ou outros bens"],
            ["🌾", "Atividade rural acima de R$ 153.199,50", "Receita bruta anual ou compensação de prejuízos"],
          ].map(([ic, title, desc]) => (
            <div key={title} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #21262D" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{ic}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#F0EDE8", marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
          <div style={{ background: "#F59E0B10", border: "1px solid #F59E0B30", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F59E0B", marginBottom: 8 }}>⚠️ Novidades importantes 2026</div>
            <div style={{ fontSize: 12, color: "#D1D5DB", lineHeight: 1.8 }}>
              {"• A isenção para quem ganha até R$ 5.000,00/mês NÃO vale nesta declaração — só valerá em 2027."}<br/>
              {"• Quem ganhou R$ 5.000,00 em 2025 pagou IR normalmente e precisa declarar."}<br/>
              {"• PIX recebido como salário, aluguel ou serviço deve ser informado."}<br/>
              {"• Declaração pré-preenchida disponível para agilizar o processo."}<br/>
              {"• Multa por atraso: mínimo R$ 165,74 ou até 20% do imposto devido."}
            </div>
          </div>
        </div>

        <div style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: 16, padding: 24 }}>
          <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>O que está incluído</div>
          {["Elaboração completa da declaração", "Análise de documentos enviados", "Cálculo de restituição ou imposto devido", "Entrega via app com comprovante", "Suporte até a entrega final"].map(item => (
            <div key={item} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <span style={{ color: "#00C896", fontSize: 14 }}>✓</span>
              <span style={{ color: "#D1D5DB", fontSize: 14 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // LOGIN
  if (screen === "login") return (
    <div style={{ minHeight: "100vh", background: "#0D1117", fontFamily: "'Georgia', serif", color: "#F0EDE8" }}>
      <div style={{ padding: "20px 28px", borderBottom: "1px solid #1E2732", display: "flex", gap: 16, alignItems: "center" }}>
        <button onClick={() => setScreen("home")} style={{ background: "transparent", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 20 }}>←</button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Acessar minha conta</div>
      </div>
      <div style={{ padding: 28, maxWidth: 520, margin: "0 auto" }}>
        <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 28 }}>Digite seu CPF e e-mail cadastrados para acessar suas declarações.</p>
        <Input label="CPF" value={loginData.cpf} onChange={e => setLoginData(p => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00" />
        <Input label="E-mail" type="email" value={loginData.email} onChange={e => setLoginData(p => ({ ...p, email: e.target.value }))} placeholder="seu@email.com" />
        {erro && <div style={{ background: "#EF444420", border: "1px solid #EF444440", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: "#FCA5A5" }}>{erro}</div>}
        <button onClick={handleLogin} disabled={loading}
          style={{ width: "100%", background: "linear-gradient(135deg, #00C896, #00A37A)", border: "none", color: "#0D1117", padding: 16, borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "Verificando..." : "Entrar →"}
        </button>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6B7280" }}>
          Ainda não tem conta?{" "}
          <span onClick={() => { setScreen("new"); setStep(1); }} style={{ color: "#00C896", cursor: "pointer" }}>Inicie sua declaração</span>
        </div>
      </div>
    </div>
  );

  // ORDERS
  if (screen === "orders") return (
    <div style={{ minHeight: "100vh", background: "#0D1117", fontFamily: "'Georgia', serif", color: "#F0EDE8" }}>
      <div style={{ padding: "20px 28px", borderBottom: "1px solid #1E2732", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Olá, {cliente?.nome?.split(" ")[0]}! 👋</div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>Suas declarações</div>
        </div>
        <button onClick={handleLogout} style={{ background: "transparent", border: "1px solid #2D3748", color: "#6B7280", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>
          Sair
        </button>
      </div>
      <div style={{ padding: 28, maxWidth: 520, margin: "0 auto" }}>
        <button onClick={() => { setScreen("new"); setStep(1); setErro(""); }} style={{ width: "100%", background: "#161B22", border: "1px dashed #2D3748", color: "#00C896", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 20 }}>
          + Nova Declaração
        </button>
        {declaracoes.length === 0 && (
          <div style={{ textAlign: "center", color: "#4B5563", fontSize: 14, padding: 40 }}>Nenhuma declaração ainda.</div>
        )}
        {declaracoes.map(decl => (
          <div key={decl.id} onClick={() => { setActiveDeclaracao(decl); setTrackingTab("status"); setScreen("tracking"); }}
            style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: 14, padding: 20, marginBottom: 14, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>IR {decl.ano_base}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 10 }}>
                  {new Date(decl.criado_em).toLocaleDateString("pt-BR")}
                </div>
                <StatusBadge s={decl.status} />
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "#00C896", fontSize: 16 }}>{decl.valor}</div>
                {decl.pix_confirmado && <div style={{ fontSize: 11, color: "#10B981", marginTop: 4 }}>✓ PIX Confirmado</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // TRACKING
  if (screen === "tracking" && activeDeclaracao) return (
    <div style={{ minHeight: "100vh", background: "#0D1117", fontFamily: "'Georgia', serif", color: "#F0EDE8", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 28px", borderBottom: "1px solid #1E2732", display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
        <button onClick={() => setScreen("orders")} style={{ background: "transparent", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 20 }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>IR {activeDeclaracao.ano_base}</div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>{new Date(activeDeclaracao.criado_em).toLocaleDateString("pt-BR")}</div>
        </div>
        <StatusBadge s={activeDeclaracao.status} />
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #1E2732", flexShrink: 0 }}>
        {[["status", "📋 Status"], ["chat", "💬 Mensagens"], ["docs", "📎 Documentos"]].map(([tab, label]) => (
          <button key={tab} onClick={() => setTrackingTab(tab)}
            style={{ flex: 1, padding: "13px 4px", background: "transparent", border: "none", color: trackingTab === tab ? "#00C896" : "#6B7280", fontWeight: trackingTab === tab ? 700 : 400, fontSize: 13, cursor: "pointer", borderBottom: trackingTab === tab ? "2px solid #00C896" : "2px solid transparent", fontFamily: "'Georgia', serif" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>
        {trackingTab === "status" && (
          <div style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
            <div style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: 16, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20, textTransform: "uppercase", letterSpacing: 1 }}>Andamento do Serviço</div>
              {STATUS_STEPS.map((s, i) => {
                const done = i < activeDeclaracao.status;
                const active = i === activeDeclaracao.status;
                return (
                  <div key={s} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: done ? "#00C896" : active ? "#3B82F6" : "#21262D", border: active ? "2px solid #3B82F6" : "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>
                        {done ? "✓" : active ? "●" : ""}
                      </div>
                      {i < STATUS_STEPS.length - 1 && <div style={{ width: 2, height: 28, background: done ? "#00C896" : "#21262D", marginTop: 2 }} />}
                    </div>
                    <div style={{ paddingBottom: i < STATUS_STEPS.length - 1 ? 20 : 0 }}>
                      <div style={{ fontWeight: active ? 700 : 500, color: done ? "#00C896" : active ? "#F0EDE8" : "#4B5563", fontSize: 14 }}>{s}</div>
                      {active && <div style={{ fontSize: 12, color: "#3B82F6", marginTop: 2 }}>Em andamento...</div>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: 14, padding: 20 }}>
              {[["Valor", activeDeclaracao.valor, "#00C896"], ["Pagamento", activeDeclaracao.pix_confirmado ? "✓ PIX Confirmado" : "⚠ Aguardando PIX", activeDeclaracao.pix_confirmado ? "#10B981" : "#F59E0B"], ["Ano-base", activeDeclaracao.ano_base, "#D1D5DB"]].map(([l, v, c]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: "#9CA3AF" }}>{l}</span>
                  <span style={{ fontSize: 14, fontWeight: l === "Valor" ? 700 : 400, color: c }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {trackingTab === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)" }}>
            <div style={{ flex: 1, overflow: "auto", padding: "16px 20px 8px" }}>
              <div style={{ background: "#161B22", border: "1px solid #2D3748", borderRadius: 10, padding: "10px 14px", marginBottom: 18, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#6B7280" }}>💬 Canal de comunicação com sua contadora — envie documentos pendentes, tire dúvidas ou deixe observações.</div>
              </div>
              {messages.map(msg => (
                <div key={msg.id} style={{ marginBottom: 16, display: "flex", flexDirection: "column", alignItems: msg.remetente === "cliente" ? "flex-end" : "flex-start" }}>
                  <div style={{ fontSize: 11, color: "#4B5563", marginBottom: 4 }}>
                    {msg.nome_remetente} · {new Date(msg.criado_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <div style={{ maxWidth: "82%", background: msg.remetente === "cliente" ? "#00C89620" : "#161B22", border: `1px solid ${msg.remetente === "cliente" ? "#00C89640" : "#21262D"}`, borderRadius: msg.remetente === "cliente" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "10px 14px" }}>
                    {msg.texto && <div style={{ fontSize: 14, color: "#E5E7EB", lineHeight: 1.5 }}>{msg.texto}</div>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 16px", borderTop: "1px solid #1E2732", background: "#0D1117", display: "flex", gap: 10, alignItems: "flex-end", flexShrink: 0 }}>
              <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
                placeholder="Mensagem, dúvida ou documento pendente..."
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensagem(); } }}
                style={{ flex: 1, background: "#161B22", border: "1px solid #2D3748", color: "#F0EDE8", padding: "10px 14px", borderRadius: 12, fontSize: 14, resize: "none", outline: "none", fontFamily: "'Georgia', serif", minHeight: 42, maxHeight: 100 }} rows={1} />
              <button onClick={enviarMensagem}
                style={{ background: "linear-gradient(135deg, #00C896, #00A37A)", border: "none", color: "#0D1117", width: 40, height: 40, borderRadius: 10, cursor: "pointer", fontSize: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                ↑
              </button>
            </div>
          </div>
        )}

        {trackingTab === "docs" && (
          <div style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
            <div style={{ background: "#F59E0B10", border: "1px solid #F59E0B30", borderRadius: 10, padding: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: "#F59E0B", fontWeight: 600, marginBottom: 4 }}>📤 Precisa enviar documentos?</div>
              <div style={{ fontSize: 12, color: "#9CA3AF" }}>Use a aba Mensagens para enviar arquivos ou entre em contato:</div>
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                <a href="mailto:iconsultrh.contato@gmail.com" style={{ fontSize: 13, color: "#D1D5DB", textDecoration: "none" }}>📧 iconsultrh.contato@gmail.com</a>
                <a href="https://wa.me/5531996463657" target="_blank" style={{ fontSize: 13, color: "#25D366", textDecoration: "none", fontWeight: 600 }}>📱 WhatsApp: (031) 9 96463657</a>
              </div>
            </div>
            {activeDeclaracao.observacoes && (
              <div style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>💬 Observação inicial</div>
                <div style={{ fontSize: 14, color: "#D1D5DB" }}>{activeDeclaracao.observacoes}</div>
              </div>
            )}
            {activeDeclaracao.outros_docs && (
              <div style={{ background: "#161B22", border: "1px solid #8B5CF640", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, color: "#A78BFA", marginBottom: 6 }}>📁 Outros documentos mencionados</div>
                <div style={{ fontSize: 14, color: "#D1D5DB" }}>{activeDeclaracao.outros_docs}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // NEW DECLARATION
  if (screen === "new") return (
    <div style={{ minHeight: "100vh", background: "#0D1117", fontFamily: "'Georgia', serif", color: "#F0EDE8" }}>
      <div style={{ padding: "20px 28px", borderBottom: "1px solid #1E2732", display: "flex", gap: 16, alignItems: "center" }}>
        <button onClick={() => step === 1 ? setScreen("home") : setStep(s => s - 1)} style={{ background: "transparent", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 20 }}>←</button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Nova Declaração</div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>Etapa {step} de 4</div>
        </div>
      </div>
      <div style={{ height: 3, background: "#161B22" }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg, #00C896, #00A37A)", width: `${(step / 4) * 100}%`, transition: "width 0.4s ease" }} />
      </div>

      <div style={{ padding: 28, maxWidth: 520, margin: "0 auto" }}>
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.5px" }}>Seus dados</h2>
            <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 28 }}>Preencha as informações básicas para iniciar</p>
            <Input label="Nome completo" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="Como no documento" />
            <Input label="CPF" value={formData.cpf} onChange={e => setFormData(p => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00" />
            <Input label="E-mail" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="seu@email.com" />
            <Input label="WhatsApp" type="tel" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="(00) 00000-0000" />
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 13, color: "#9CA3AF", display: "block", marginBottom: 6 }}>Ano-base da declaração</label>
              <select value={formData.year} onChange={e => setFormData(p => ({ ...p, year: e.target.value }))}
                style={{ width: "100%", background: "#161B22", border: "1px solid #2D3748", color: "#F0EDE8", padding: "12px 14px", borderRadius: 10, fontSize: 15, outline: "none" }}>
                <option>2025</option><option>2024</option><option>2023</option>
              </select>
            </div>
            <button onClick={() => setStep(2)} style={{ width: "100%", background: "linear-gradient(135deg, #00C896, #00A37A)", border: "none", color: "#0D1117", padding: 16, borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
              Continuar →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.5px" }}>Checklist de documentos</h2>
            <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 10 }}>Marque o que você tem disponível</p>
            <div style={{ background: "#161B22", border: "1px solid #2D3748", borderRadius: 10, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "#9CA3AF" }}>Documentos confirmados</span>
              <span style={{ fontWeight: 800, color: "#00C896", fontSize: 18 }}>{totalChecked}<span style={{ color: "#4B5563", fontWeight: 400 }}>/{totalItems}</span></span>
            </div>
            {CHECKLIST.map(cat => (
              <div key={cat.id} style={{ marginBottom: 10 }}>
                <button onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                  style={{ width: "100%", background: "#161B22", border: "1px solid #21262D", borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", color: "#F0EDE8" }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{cat.icon} {cat.category}</span>
                  <span style={{ color: "#6B7280", fontSize: 12 }}>{cat.items.filter((_, i) => checkedDocs[`${cat.id}-${i}`]).length}/{cat.items.length} · {expandedCategory === cat.id ? "▲" : "▼"}</span>
                </button>
                {expandedCategory === cat.id && (
                  <div style={{ background: "#0D1117", border: "1px solid #21262D", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "8px 18px 14px" }}>
                    {cat.items.map((item, i) => {
                      const key = `${cat.id}-${i}`;
                      return (
                        <div key={key} onClick={() => toggleDoc(key)}
                          style={{ display: "flex", gap: 12, alignItems: "center", padding: "9px 0", borderBottom: i < cat.items.length - 1 ? "1px solid #161B22" : "none", cursor: "pointer" }}>
                          <div style={{ width: 20, height: 20, borderRadius: 5, border: checkedDocs[key] ? "none" : "2px solid #374151", background: checkedDocs[key] ? "#00C896" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {checkedDocs[key] && <span style={{ color: "#0D1117", fontSize: 12, fontWeight: 900 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: 14, color: checkedDocs[key] ? "#D1D5DB" : "#9CA3AF", textDecoration: checkedDocs[key] ? "line-through" : "none" }}>{item}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            <div style={{ height: 20 }} />
            <button onClick={() => setStep(3)} style={{ width: "100%", background: "linear-gradient(135deg, #00C896, #00A37A)", border: "none", color: "#0D1117", padding: 16, borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
              Continuar →
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.5px" }}>Documentos e observações</h2>
            <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 20 }}>Descreva documentos extras e deixe observações para a contadora.</p>

            <div style={{ background: "#161B22", border: "1px solid #8B5CF640", borderRadius: 14, padding: 18, marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#A78BFA", marginBottom: 4 }}>📁 Outros documentos</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>Tem algum documento fora da lista? Descreva aqui.</div>
              <textarea value={otherDocsNote} onChange={e => setOtherDocsNote(e.target.value)}
                placeholder="Ex: Recibo de doação, carnê-leão, ganho em leilão, herança recebida..."
                rows={3}
                style={{ width: "100%", background: "#0D1117", border: "1px solid #2D3748", color: "#F0EDE8", padding: "10px 14px", borderRadius: 10, fontSize: 13, outline: "none", resize: "vertical", fontFamily: "'Georgia', serif", boxSizing: "border-box" }} />
            </div>

            <div style={{ background: "#161B22", border: "1px solid #F59E0B40", borderRadius: 14, padding: 18, marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#FCD34D", marginBottom: 4 }}>💬 Observações para a contadora</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>Situações especiais, dúvidas ou detalhes importantes.</div>
              <textarea value={initialObs} onChange={e => setInitialObs(e.target.value)}
                placeholder="Ex: Tive dois empregos no ano, vendi um imóvel em junho, tenho dependente com deficiência..."
                rows={4}
                style={{ width: "100%", background: "#0D1117", border: "1px solid #2D3748", color: "#F0EDE8", padding: "10px 14px", borderRadius: 10, fontSize: 13, outline: "none", resize: "vertical", fontFamily: "'Georgia', serif", boxSizing: "border-box" }} />
            </div>

            <div style={{ background: "#F59E0B10", border: "1px solid #F59E0B30", borderRadius: 14, padding: 18, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: "#F59E0B", fontWeight: 700, marginBottom: 10 }}>💡 Prefere enviar por outro canal?</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>📧</span>
                <a href="mailto:iconsultrh.contato@gmail.com" style={{ fontSize: 13, color: "#D1D5DB", textDecoration: "none" }}>iconsultrh.contato@gmail.com</a>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>📱</span>
                <a href="https://wa.me/5531996463657" target="_blank" style={{ fontSize: 13, color: "#25D366", textDecoration: "none", fontWeight: 700 }}>WhatsApp: (031) 9 96463657</a>
              </div>
            </div>

            <button onClick={() => setStep(4)} style={{ width: "100%", background: "linear-gradient(135deg, #00C896, #00A37A)", border: "none", color: "#0D1117", padding: 16, borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer" }}>
              Continuar →
            </button>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.5px" }}>Pagamento via PIX</h2>
            <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 20 }}>Após a confirmação iniciaremos a elaboração da sua declaração.</p>

            <div style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: 16, padding: 24, marginBottom: 16 }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Total a pagar</div>
                <div style={{ fontSize: 40, fontWeight: 800, color: "#00C896", letterSpacing: "-1px" }}>R$ 120,00</div>
                <div style={{ fontSize: 12, color: "#4B5563", marginTop: 4 }}>Declaração IRPF {formData.year}</div>
              </div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ display: "inline-block", background: "white", padding: 16, borderRadius: 12 }}>
                  <div style={{ width: 140, height: 140, display: "grid", gridTemplateColumns: "repeat(10,1fr)", gap: 1 }}>
                    {Array.from({ length: 100 }).map((_, i) => (
                      <div key={i} style={{ background: (i * 7 + i * i) % 3 !== 0 ? "#000" : "#fff", borderRadius: 1 }} />
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 8 }}>Aponte a câmera do seu banco para o QR Code</div>
              </div>
              <div style={{ background: "#0D1117", border: "1px solid #2D3748", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Chave PIX · CPF</div>
                <div style={{ fontSize: 15, color: "#D1D5DB", fontFamily: "monospace", marginBottom: 10, letterSpacing: 2 }}>054.675.146-60</div>
                <button onClick={copyPix}
                  style={{ width: "100%", background: pixCopied ? "#00C89620" : "#1E2732", border: `1px solid ${pixCopied ? "#00C896" : "#2D3748"}`, color: pixCopied ? "#00C896" : "#9CA3AF", padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  {pixCopied ? "✓ Copiado!" : "📋 Copiar chave PIX"}
                </button>
              </div>
            </div>

            <div style={{ background: "#3B82F610", border: "1px solid #3B82F640", borderRadius: 14, padding: 18, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#60A5FA", marginBottom: 6 }}>📸 Envie o comprovante do PIX</div>
              <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6, marginBottom: 14 }}>Após pagar, envie o comprovante para agilizar a confirmação.</div>
              {pixReceipt ? (
                <div style={{ background: "#0D1117", border: "1px solid #10B98150", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#10B981", fontSize: 16 }}>✓</span>
                  <span style={{ fontSize: 13, color: "#D1D5DB", flex: 1 }}>{pixReceipt}</span>
                  <button onClick={() => setPixReceiptFile(null)} style={{ background: "transparent", border: "none", color: "#4B5563", cursor: "pointer", fontSize: 16 }}>×</button>
                </div>
              ) : (
                <label style={{ display: "flex", gap: 12, alignItems: "center", background: "#0D1117", border: "1px dashed #3B82F650", borderRadius: 10, padding: "14px 16px", cursor: "pointer" }}>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={e => e.target.files[0] && setPixReceiptFile(e.target.files[0].name)} />
                  <span style={{ fontSize: 22 }}>📤</span>
                  <div>
                    <div style={{ fontSize: 13, color: "#60A5FA", fontWeight: 600 }}>Anexar comprovante</div>
                    <div style={{ fontSize: 11, color: "#4B5563", marginTop: 2 }}>PDF, JPG ou captura de tela</div>
                  </div>
                </label>
              )}
            </div>

            {erro && <div style={{ background: "#EF444420", border: "1px solid #EF444440", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: "#FCA5A5" }}>{erro}</div>}

            <button onClick={salvarDeclaracao} disabled={loading}
              style={{ width: "100%", background: "linear-gradient(135deg, #00C896, #00A37A)", border: "none", color: "#0D1117", padding: 16, borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 10, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Salvando..." : "✓ Já realizei o pagamento"}
            </button>
            <div style={{ textAlign: "center", fontSize: 12, color: "#4B5563" }}>Confirmação via e-mail e WhatsApp após validação</div>
          </div>
        )}
      </div>
    </div>
  );

  return null;
}
