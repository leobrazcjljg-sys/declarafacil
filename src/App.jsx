import { useState } from "react";

const CHECKLIST = [
  { id: 1, category: "Identificação", icon: "👤", items: ["CPF e RG", "Título de eleitor", "Endereço completo atualizado", "Data de nascimento e naturalidade"] },
  { id: 2, category: "Rendimentos", icon: "💼", items: ["Informe de rendimentos do empregador (DIRF)", "Comprovante de pró-labore (se sócio)", "Recibos de aluguéis recebidos", "Extratos bancários com rendimentos de investimentos"] },
  { id: 3, category: "Bens e Direitos", icon: "🏠", items: ["Escritura ou contrato de imóveis", "Documento de veículos (CRLV)", "Extratos de contas bancárias e investimentos (31/12)", "Contrato de participação societária"] },
  { id: 4, category: "Deduções", icon: "📋", items: ["Recibos de plano de saúde (titular e dependentes)", "Notas fiscais de médicos, dentistas, psicólogos", "Comprovante de pagamento de escola/faculdade", "PGBL/VGBL – informe da seguradora"] },
  { id: 5, category: "Dependentes", icon: "👨‍👩‍👧", items: ["CPF dos dependentes", "Certidão de nascimento dos filhos", "Comprovante de guarda/tutela, se aplicável"] },
  { id: 6, category: "Dívidas e Ônus", icon: "📄", items: ["Contratos de financiamento imobiliário", "Empréstimos bancários com saldo devedor"] },
];

const STATUS_STEPS = ["Aguardando Documentos", "Em Análise", "Em Elaboração", "Revisão Final", "Entregue"];

const MOCK_MESSAGES = [
  { id: 1, from: "contador", name: "Contadora Ana", time: "06/03 14:22", text: "Olá! Recebi seus documentos. Preciso que você envie também o informe de rendimentos do banco Itaú, que não estava na lista. Pode enviar aqui mesmo ou via WhatsApp.", files: [] },
  { id: 2, from: "cliente", name: "Você", time: "06/03 15:10", text: "Boa tarde! Vou procurar e envio ainda hoje.", files: [] },
  { id: 3, from: "contador", name: "Contadora Ana", time: "07/03 09:05", text: "Perfeito, obrigada! Assim que chegar já dou continuidade. 😊", files: [] },
  { id: 4, from: "cliente", name: "Você", time: "07/03 09:48", text: "Segue o informe anexado!", files: ["informe_itau_2024.pdf"] },
];

const MOCK_ORDERS = [
  { id: "IR-2025-001", year: "2025", status: 3, date: "05/03/2026", value: "R$ 290,00", paid: true, messages: MOCK_MESSAGES },
  { id: "IR-2024-001", year: "2024", status: 4, date: "10/02/2025", value: "R$ 250,00", paid: true, file: true, messages: [] },
];

export default function App() {
  const [screen, setScreen] = useState("home");
  const [activeOrder, setActiveOrder] = useState(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", cpf: "", email: "", phone: "", year: "2025" });
  const [checkedDocs, setCheckedDocs] = useState({});
  const [pixCopied, setPixCopied] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [otherDocsNote, setOtherDocsNote] = useState("");
  const [initialObs, setInitialObs] = useState("");
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [pixReceipt, setPixReceiptFile] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [msgFiles, setMsgFiles] = useState([]);
  const [trackingTab, setTrackingTab] = useState("status");

  const totalChecked = Object.values(checkedDocs).filter(Boolean).length;
  const totalItems = CHECKLIST.reduce((a, c) => a + c.items.length, 0);

  function toggleDoc(key) { setCheckedDocs(prev => ({ ...prev, [key]: !prev[key] })); }

  function copyPix() {
    navigator.clipboard.writeText("05467514660").catch(() => {});
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  }

  function sendMessage() {
    if (!newMessage.trim() && msgFiles.length === 0) return;
    setMessages(prev => [...prev, {
      id: Date.now(), from: "cliente", name: "Você",
      time: new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", ""),
      text: newMessage.trim(),
      files: [...msgFiles]
    }]);
    setNewMessage("");
    setMsgFiles([]);
  }

  const StatusBadge = ({ s }) => {
    const colors = ["#F59E0B", "#3B82F6", "#8B5CF6", "#EC4899", "#10B981"];
    return (
      <span style={{ background: colors[s] + "20", color: colors[s], padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>
        {STATUS_STEPS[s]}
      </span>
    );
  };

  // HOME
  if (screen === "home") return (
    <div style={{ minHeight: "100vh", background: "#0D1117", fontFamily: "'Georgia', serif", color: "#F0EDE8" }}>
      <div style={{ padding: "20px 28px", borderBottom: "1px solid #1E2732", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#00C896", letterSpacing: "-0.5px" }}>📊 DeclaraFácil</div>
          <div style={{ fontSize: 11, color: "#6B7280", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>Imposto de Renda Simplificado</div>
        </div>
        <button onClick={() => setScreen("orders")} style={{ background: "transparent", border: "1px solid #2D3748", color: "#9CA3AF", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
          Minhas Declarações
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
        <div style={{ marginTop: 12, fontSize: 13, color: "#4B5563" }}>A partir de R$ 290,00 · Pagamento via PIX</div>
      </div>
      <div style={{ padding: "0 28px 40px", maxWidth: 520, margin: "0 auto" }}>
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

  // ORDERS
  if (screen === "orders") return (
    <div style={{ minHeight: "100vh", background: "#0D1117", fontFamily: "'Georgia', serif", color: "#F0EDE8" }}>
      <div style={{ padding: "20px 28px", borderBottom: "1px solid #1E2732", display: "flex", gap: 16, alignItems: "center" }}>
        <button onClick={() => setScreen("home")} style={{ background: "transparent", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 20 }}>←</button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Minhas Declarações</div>
      </div>
      <div style={{ padding: 28, maxWidth: 520, margin: "0 auto" }}>
        <button onClick={() => { setScreen("new"); setStep(1); }} style={{ width: "100%", background: "#161B22", border: "1px dashed #2D3748", color: "#00C896", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 20 }}>
          + Nova Declaração
        </button>
        {MOCK_ORDERS.map(order => (
          <div key={order.id} onClick={() => { setActiveOrder(order); setMessages(order.messages || []); setTrackingTab("status"); setScreen("tracking"); }}
            style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: 14, padding: 20, marginBottom: 14, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>IR {order.year}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 10 }}>{order.id} · {order.date}</div>
                <StatusBadge s={order.status} />
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "#00C896", fontSize: 16 }}>{order.value}</div>
                {order.messages?.length > 0 && <div style={{ fontSize: 11, color: "#3B82F6", marginTop: 4 }}>💬 {order.messages.length} mensagens</div>}
                {order.file && <div style={{ fontSize: 11, color: "#10B981", marginTop: 4 }}>📎 Declaração pronta</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // TRACKING
  if (screen === "tracking" && activeOrder) return (
    <div style={{ minHeight: "100vh", background: "#0D1117", fontFamily: "'Georgia', serif", color: "#F0EDE8", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 28px", borderBottom: "1px solid #1E2732", display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
        <button onClick={() => setScreen("orders")} style={{ background: "transparent", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 20 }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>IR {activeOrder.year}</div>
          <div style={{ fontSize: 12, color: "#6B7280" }}>{activeOrder.id}</div>
        </div>
        <StatusBadge s={activeOrder.status} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #1E2732", flexShrink: 0 }}>
        {[["status", "📋 Status"], ["chat", "💬 Mensagens"], ["docs", "📎 Documentos"]].map(([tab, label]) => (
          <button key={tab} onClick={() => setTrackingTab(tab)}
            style={{ flex: 1, padding: "13px 4px", background: "transparent", border: "none", color: trackingTab === tab ? "#00C896" : "#6B7280", fontWeight: trackingTab === tab ? 700 : 400, fontSize: 13, cursor: "pointer", borderBottom: trackingTab === tab ? "2px solid #00C896" : "2px solid transparent", fontFamily: "'Georgia', serif" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "auto" }}>

        {/* STATUS TAB */}
        {trackingTab === "status" && (
          <div style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
            <div style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: 16, padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20, textTransform: "uppercase", letterSpacing: 1 }}>Andamento do Serviço</div>
              {STATUS_STEPS.map((s, i) => {
                const done = i < activeOrder.status;
                const active = i === activeOrder.status;
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
            <div style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: 14, padding: 20, marginBottom: 16 }}>
              {[["Valor pago", activeOrder.value, "#00C896"], ["Pagamento", "✓ PIX Confirmado", "#10B981"], ["Data", activeOrder.date, "#D1D5DB"]].map(([l, v, c]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: "#9CA3AF" }}>{l}</span>
                  <span style={{ fontSize: 14, fontWeight: l === "Valor pago" ? 700 : 400, color: c }}>{v}</span>
                </div>
              ))}
            </div>
            {activeOrder.file && (
              <div style={{ background: "#00C89610", border: "1px solid #00C89630", borderRadius: 14, padding: 20 }}>
                <div style={{ fontWeight: 700, color: "#00C896", marginBottom: 6 }}>🎉 Declaração pronta!</div>
                <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 14 }}>Sua declaração foi concluída e está disponível para download.</div>
                <button style={{ width: "100%", background: "#00C896", border: "none", color: "#0D1117", padding: 12, borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 14 }}>
                  📥 Baixar Declaração (PDF)
                </button>
              </div>
            )}
          </div>
        )}

        {/* CHAT TAB */}
        {trackingTab === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)" }}>
            <div style={{ flex: 1, overflow: "auto", padding: "16px 20px 8px" }}>
              <div style={{ background: "#161B22", border: "1px solid #2D3748", borderRadius: 10, padding: "10px 14px", marginBottom: 18, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#6B7280" }}>💬 Canal de comunicação com sua contadora — envie documentos pendentes, tire dúvidas ou deixe observações a qualquer momento.</div>
              </div>
              {messages.map(msg => (
                <div key={msg.id} style={{ marginBottom: 16, display: "flex", flexDirection: "column", alignItems: msg.from === "cliente" ? "flex-end" : "flex-start" }}>
                  <div style={{ fontSize: 11, color: "#4B5563", marginBottom: 4, paddingLeft: msg.from === "contador" ? 4 : 0, paddingRight: msg.from === "cliente" ? 4 : 0 }}>
                    {msg.name} · {msg.time}
                  </div>
                  <div style={{ maxWidth: "82%", background: msg.from === "cliente" ? "#00C89620" : "#161B22", border: `1px solid ${msg.from === "cliente" ? "#00C89640" : "#21262D"}`, borderRadius: msg.from === "cliente" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", padding: "10px 14px" }}>
                    {msg.text && <div style={{ fontSize: 14, color: "#E5E7EB", lineHeight: 1.5 }}>{msg.text}</div>}
                    {msg.files?.map((f, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: msg.text ? 8 : 0, background: "#0D111780", padding: "6px 10px", borderRadius: 8 }}>
                        <span style={{ color: "#00C896" }}>📄</span>
                        <span style={{ fontSize: 12, color: "#9CA3AF" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {msgFiles.length > 0 && (
              <div style={{ padding: "8px 16px", background: "#161B22", borderTop: "1px solid #21262D", display: "flex", gap: 8, flexWrap: "wrap" }}>
                {msgFiles.map((f, i) => (
                  <div key={i} style={{ background: "#00C89615", border: "1px solid #00C89630", borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, color: "#00C896" }}>📎 {f}</span>
                    <button onClick={() => setMsgFiles(p => p.filter((_, j) => j !== i))} style={{ background: "transparent", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 14, padding: 0 }}>×</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ padding: "12px 16px", borderTop: "1px solid #1E2732", background: "#0D1117", display: "flex", gap: 10, alignItems: "flex-end", flexShrink: 0 }}>
              <label style={{ cursor: "pointer", color: "#6B7280", fontSize: 22, flexShrink: 0, paddingBottom: 7 }}>
                📎
                <input type="file" multiple style={{ display: "none" }} onChange={e => setMsgFiles(p => [...p, ...Array.from(e.target.files).map(f => f.name)])} />
              </label>
              <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
                placeholder="Mensagem, dúvida ou documento pendente..."
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                style={{ flex: 1, background: "#161B22", border: "1px solid #2D3748", color: "#F0EDE8", padding: "10px 14px", borderRadius: 12, fontSize: 14, resize: "none", outline: "none", fontFamily: "'Georgia', serif", minHeight: 42, maxHeight: 100 }} rows={1} />
              <button onClick={sendMessage}
                style={{ background: "linear-gradient(135deg, #00C896, #00A37A)", border: "none", color: "#0D1117", width: 40, height: 40, borderRadius: 10, cursor: "pointer", fontSize: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                ↑
              </button>
            </div>
          </div>
        )}

        {/* DOCS TAB */}
        {trackingTab === "docs" && (
          <div style={{ padding: 24, maxWidth: 520, margin: "0 auto" }}>
            <div style={{ background: "#F59E0B10", border: "1px solid #F59E0B30", borderRadius: 10, padding: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: "#F59E0B", fontWeight: 600, marginBottom: 4 }}>📤 Precisa enviar mais documentos?</div>
              <div style={{ fontSize: 12, color: "#9CA3AF" }}>Use a aba Mensagens para enviar arquivos pendentes solicitados pela contadora.</div>
            </div>
            {[
              { name: "Informe de rendimentos Bradesco.pdf", date: "05/03", size: "342 KB" },
              { name: "Nota fiscal médica.jpg", date: "05/03", size: "180 KB" },
              { name: "informe_itau_2024.pdf", date: "07/03", size: "210 KB" },
            ].map((f, i) => (
              <div key={i} style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: 12, padding: "14px 16px", marginBottom: 10, display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 24 }}>📄</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: "#E5E7EB", fontWeight: 600 }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: "#4B5563", marginTop: 2 }}>{f.date} · {f.size}</div>
                </div>
                <span style={{ color: "#10B981", fontSize: 12 }}>✓ Recebido</span>
              </div>
            ))}
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

        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.5px" }}>Seus dados</h2>
            <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 28 }}>Preencha as informações básicas para iniciar</p>
            {[
              { label: "Nome completo", key: "name", type: "text", placeholder: "Como no documento" },
              { label: "CPF", key: "cpf", type: "text", placeholder: "000.000.000-00" },
              { label: "E-mail", key: "email", type: "email", placeholder: "seu@email.com" },
              { label: "WhatsApp", key: "phone", type: "tel", placeholder: "(00) 00000-0000" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, color: "#9CA3AF", display: "block", marginBottom: 6 }}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={formData[f.key]}
                  onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: "100%", background: "#161B22", border: "1px solid #2D3748", color: "#F0EDE8", padding: "12px 14px", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
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

        {/* STEP 2 */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.5px" }}>Checklist de documentos</h2>
            <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 10 }}>Marque o que você tem disponível para enviar</p>
            <div style={{ background: "#161B22", border: "1px solid #2D3748", borderRadius: 10, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "#9CA3AF" }}>Documentos confirmados</span>
              <span style={{ fontWeight: 800, color: "#00C896", fontSize: 18 }}>{totalChecked}<span style={{ color: "#4B5563", fontWeight: 400 }}>/{totalItems}</span></span>
            </div>
            {CHECKLIST.map(cat => (
              <div key={cat.id} style={{ marginBottom: 10 }}>
                <button onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                  style={{ width: "100%", background: "#161B22", border: "1px solid #21262D", borderRadius: 12, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", color: "#F0EDE8" }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{cat.icon} {cat.category}</span>
                  <span style={{ color: "#6B7280", fontSize: 12 }}>
                    {cat.items.filter((_, i) => checkedDocs[`${cat.id}-${i}`]).length}/{cat.items.length} · {expandedCategory === cat.id ? "▲" : "▼"}
                  </span>
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

        {/* STEP 3 */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.5px" }}>Envio de documentos</h2>
            <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 20 }}>Anexe os documentos do checklist. PDF, JPG ou PNG.</p>

            {/* Upload principal */}
            <label style={{ display: "block", background: "#161B22", border: "2px dashed #2D3748", borderRadius: 14, padding: "28px 20px", textAlign: "center", cursor: "pointer", marginBottom: 14 }}>
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
                onChange={e => setUploadedFiles(prev => [...prev, ...Array.from(e.target.files).map(f => f.name)])} />
              <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
              <div style={{ fontWeight: 700, color: "#F0EDE8", marginBottom: 4 }}>Toque para selecionar arquivos</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>PDF, JPG ou PNG até 20MB cada</div>
            </label>

            {uploadedFiles.length > 0 && (
              <div style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 10 }}>Arquivos anexados ({uploadedFiles.length})</div>
                {uploadedFiles.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", borderBottom: i < uploadedFiles.length - 1 ? "1px solid #21262D" : "none" }}>
                    <span style={{ color: "#00C896" }}>📄</span>
                    <span style={{ fontSize: 13, color: "#D1D5DB", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{f}</span>
                    <button onClick={() => setUploadedFiles(p => p.filter((_, j) => j !== i))}
                      style={{ background: "transparent", border: "none", color: "#4B5563", cursor: "pointer", fontSize: 16 }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {/* OUTROS DOCUMENTOS */}
            <div style={{ background: "#161B22", border: "1px solid #8B5CF640", borderRadius: 14, padding: 18, marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#A78BFA", marginBottom: 4 }}>📁 Outros documentos</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>Tem algum documento fora da lista acima? Descreva e anexe se quiser.</div>
              <textarea value={otherDocsNote} onChange={e => setOtherDocsNote(e.target.value)}
                placeholder="Ex: Recibo de doação a partido político, carnê-leão, ganho em leilão, herança recebida..."
                rows={3}
                style={{ width: "100%", background: "#0D1117", border: "1px solid #2D3748", color: "#F0EDE8", padding: "10px 14px", borderRadius: 10, fontSize: 13, outline: "none", resize: "vertical", fontFamily: "'Georgia', serif", boxSizing: "border-box", marginBottom: 10 }} />
              <label style={{ display: "flex", gap: 8, alignItems: "center", background: "#0D1117", border: "1px dashed #8B5CF640", borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }}
                  onChange={e => setUploadedFiles(prev => [...prev, ...Array.from(e.target.files).map(f => "📁 " + f.name)])} />
                <span style={{ fontSize: 16 }}>📎</span>
                <span style={{ color: "#9CA3AF", fontSize: 13 }}>Anexar outros documentos</span>
              </label>
            </div>

            {/* OBSERVAÇÕES */}
            <div style={{ background: "#161B22", border: "1px solid #F59E0B40", borderRadius: 14, padding: 18, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#FCD34D", marginBottom: 4 }}>💬 Observações para a contadora</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>Informe situações especiais, dúvidas ou detalhes que a contadora deva saber antes de iniciar.</div>
              <textarea value={initialObs} onChange={e => setInitialObs(e.target.value)}
                placeholder="Ex: Tive dois empregos no ano, vendi um imóvel em junho, tenho dependente com deficiência, recebi aluguel por temporada..."
                rows={4}
                style={{ width: "100%", background: "#0D1117", border: "1px solid #2D3748", color: "#F0EDE8", padding: "10px 14px", borderRadius: 10, fontSize: 13, outline: "none", resize: "vertical", fontFamily: "'Georgia', serif", boxSizing: "border-box" }} />
            </div>

            {/* CONTATO */}
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

        {/* STEP 4 */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.5px" }}>Pagamento via PIX</h2>
            <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 20 }}>Após a confirmação iniciaremos a elaboração da sua declaração.</p>

            <div style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: 16, padding: 24, marginBottom: 16 }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Total a pagar</div>
                <div style={{ fontSize: 40, fontWeight: 800, color: "#00C896", letterSpacing: "-1px" }}>R$ 290,00</div>
                <div style={{ fontSize: 12, color: "#4B5563", marginTop: 4 }}>Declaração IRPF {formData.year} · 1 pessoa</div>
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
                <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>Chave PIX · Copia e Cola</div>
                <div style={{ fontSize: 11, color: "#D1D5DB", wordBreak: "break-all", fontFamily: "monospace", marginBottom: 10 }}>
                  00020126330014BR.GOV.BCB.PIX... CPF: 054.675.146-60
                </div>
                <button onClick={copyPix}
                  style={{ width: "100%", background: pixCopied ? "#00C89620" : "#1E2732", border: `1px solid ${pixCopied ? "#00C896" : "#2D3748"}`, color: pixCopied ? "#00C896" : "#9CA3AF", padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  {pixCopied ? "✓ Copiado!" : "📋 Copiar código PIX"}
                </button>
              </div>
            </div>

            {/* COMPROVANTE PIX */}
            <div style={{ background: "#3B82F610", border: "1px solid #3B82F640", borderRadius: 14, padding: 18, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#60A5FA", marginBottom: 6 }}>📸 Envie o comprovante do PIX</div>
              <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.6, marginBottom: 14 }}>
                Após realizar o pagamento, anexe o comprovante aqui. Isso agiliza a confirmação e garante prioridade no atendimento.
              </div>
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
                    <div style={{ fontSize: 13, color: "#60A5FA", fontWeight: 600 }}>Anexar comprovante de pagamento</div>
                    <div style={{ fontSize: 11, color: "#4B5563", marginTop: 2 }}>PDF, JPG ou captura de tela — até 10MB</div>
                  </div>
                </label>
              )}
            </div>

            {/* Resumo */}
            <div style={{ background: "#161B22", border: "1px solid #21262D", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 10 }}>Resumo do pedido</div>
              {[
                ["Cliente", formData.name || "—", "#D1D5DB"],
                ["CPF", formData.cpf || "—", "#D1D5DB"],
                ["Ano-base", formData.year, "#D1D5DB"],
                ["Documentos", `${uploadedFiles.length} arquivo(s)`, "#D1D5DB"],
                ["Comprovante PIX", pixReceipt ? "✓ Anexado" : "⚠ Pendente", pixReceipt ? "#10B981" : "#F59E0B"],
              ].map(([label, value, color]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: "#6B7280" }}>{label}</span>
                  <span style={{ fontSize: 14, color }}>{value}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setScreen("orders")}
              style={{ width: "100%", background: "linear-gradient(135deg, #00C896, #00A37A)", border: "none", color: "#0D1117", padding: 16, borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 10 }}>
              ✓ Já realizei o pagamento
            </button>
            <div style={{ textAlign: "center", fontSize: 12, color: "#4B5563" }}>Confirmação via e-mail e WhatsApp após validação</div>
          </div>
        )}
      </div>
    </div>
  );

  return null;
}
