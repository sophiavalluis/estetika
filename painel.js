document.addEventListener("DOMContentLoaded", async () => {

  // 🔗 SUPABASE
  const supabaseUrl =
    "https://bjaurtrqrasznuptthyf.supabase.co";

  const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqYXVydHJxcmFzem51cHR0aHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDkwNTIsImV4cCI6MjA5MzQ4NTA1Mn0.iCQyvzAJykzgLO4kZkJZ8qNbv3549rG_JuwcVEZDrKA";

  const supabase =
    window.supabase.createClient(
      supabaseUrl,
      supabaseKey
    );

  // 📦 ELEMENTOS
  const lista =
    document.getElementById("lista");

  let statusAtual = "booked";

  // 🔐 PEGAR USER
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // 🚫 NÃO LOGADO
  if (!user) {

    window.location.href =
      "login.html";

    return;
  }

  // 👤 PERFIL
  const {
    data: profile,
    error: profileError
  } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {

    console.log(profileError);

  }

  // 🎨 SETAR PERFIL
  if (profile) {

    const studioName =
      document.getElementById("studioName");

    const logo =
      document.getElementById("logo");

    if (studioName) {

      studioName.innerText =
        profile.studio_name || "Meu Studio";
    }

    if (
      logo &&
      profile.logo_url
    ) {

      logo.src =
        profile.logo_url;
    }

  }

  function atualizarBotoesAtivos() {
    ["booked", "done", "cancelled"].forEach(status => {
      const btn = document.getElementById(`btn-${status}`);
      if (btn) btn.classList.toggle("active", status === statusAtual);
    });
  }

  function renderizarIcones(container = document) {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons({ root: container });
    }
  }

  // 📥 CARREGAR AGENDAMENTOS
  async function carregarAgendamentos() {

    lista.innerHTML = `
      <div class="text-center text-gray-500 py-10">
        Carregando...
      </div>
    `;
    renderizarIcones(lista);

    // 🔍 QUERY
    let query =
      supabase
        .from("appointments")
        .select("*")
        .eq("user_id", user.id)
        .order("date", {
          ascending: true
        })
        .order("time", {
          ascending: true
        });

    // 📌 FILTROS
    if (statusAtual === "booked") {

      query =
        query.or(
          "status.eq.booked,status.is.null"
        );

    } else {

      query =
        query.eq(
          "status",
          statusAtual
        );

    }

    // 🚀 EXECUTAR
    const {
      data,
      error
    } = await query;

    // ❌ ERRO
    if (error) {

      console.log(error);

      lista.innerHTML = `
        <div class="text-center text-red-500 py-10">
          Erro ao carregar
        </div>
      `;

      renderizarIcones(lista);
      return;
    }

    // 🚫 VAZIO
    if (!data || data.length === 0) {

      lista.innerHTML = `
        <div class="text-center text-gray-400 py-10">
          Nenhum agendamento
        </div>
      `;

      renderizarIcones(lista);
      return;
    }

    // 🔄 LIMPAR
    lista.innerHTML = "";

    // 🎨 RENDER
    data.forEach(item => {

      const div =
        document.createElement("div");

      // 🎨 CORES
      let cor =
        "bg-white border-pink-100";

      if (item.status === "done") {

        cor =
          "bg-green-50 border-green-200";
      }

      if (item.status === "cancelled") {

        cor =
          "bg-red-50 border-red-200";
      }

      div.className =
        `
        p-5
        rounded-3xl
        shadow-md
        border
        ${cor}
        transition
      `;

      const nomeSeguro = escaparHTML(item.name || "Cliente");
      const servicoSeguro = escaparHTML(item.service || "Serviço não informado");
      const dataSegura = escaparHTML(item.date || "Data não informada");
      const horarioSeguro = escaparHTML(item.time || "--:--");
      const statusLabel = item.status === "done" ? "Concluído" : item.status === "cancelled" ? "Cancelado" : "Agendado";
      const statusIcon = item.status === "done" ? "check-circle-2" : item.status === "cancelled" ? "calendar-x" : "clock-3";
      const statusColor = item.status === "done" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : item.status === "cancelled" ? "bg-rose-50 text-rose-700 border-rose-100" : "bg-[#f8f0f3] text-[#a56780] border-[#f0dfe6]";

      div.className = "appointment surface rounded-[24px] p-5 md:p-6 border border-[#eee7eb]";
      div.innerHTML = `
        <div class="flex items-start justify-between gap-3 mb-5">
          <div class="min-w-0">
            <p class="text-[10px] uppercase tracking-[.18em] font-bold text-[#b17a90] mb-2">ATENDIMENTO</p>
            <h2 class="font-extrabold text-xl text-[#302a30] truncate">${nomeSeguro}</h2>
            <p class="text-sm text-[#817780] mt-1">${servicoSeguro}</p>
          </div>
          <span class="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-full border ${statusColor} whitespace-nowrap">
            <i data-lucide="${statusIcon}" class="icon icon-sm"></i>${statusLabel}
          </span>
        </div>
        <div class="grid grid-cols-2 gap-3 mb-5">
          <div class="rounded-2xl bg-[#faf7f8] border border-[#f1eaee] p-3.5">
            <p class="text-[10px] uppercase tracking-wider text-[#a0969e] font-bold mb-1.5">Data</p>
            <p class="text-sm font-semibold text-[#514850] flex items-center gap-2"><i data-lucide="calendar-days" class="icon icon-sm text-[#b17a90]"></i>${dataSegura}</p>
          </div>
          <div class="rounded-2xl bg-[#faf7f8] border border-[#f1eaee] p-3.5">
            <p class="text-[10px] uppercase tracking-wider text-[#a0969e] font-bold mb-1.5">Horário</p>
            <p class="text-sm font-semibold text-[#514850] flex items-center gap-2"><i data-lucide="clock-3" class="icon icon-sm text-[#b17a90]"></i>${horarioSeguro}</p>
          </div>
        </div>
        ${item.status === "booked" || item.status === null ? `
          <div class="flex flex-col gap-2">
            <button data-action="ver-detalhes" class="action soft w-full"><i data-lucide="eye" class="icon"></i>Ver detalhes</button>
            <div class="grid grid-cols-2 gap-2">
              <button onclick="concluir(${Number(item.id)})" class="action w-full bg-emerald-600 hover:bg-emerald-700 text-white"><i data-lucide="check" class="icon"></i>Concluir</button>
              <button onclick="cancelar(${Number(item.id)})" class="action w-full bg-white border border-rose-200 text-rose-700 hover:bg-rose-50"><i data-lucide="x" class="icon"></i>Cancelar</button>
            </div>
          </div>
        ` : `<button data-action="ver-detalhes" class="action soft w-full"><i data-lucide="eye" class="icon"></i>Ver detalhes</button>`}
      `;
      renderizarIcones(div);

      const botaoDetalhes = div.querySelector('[data-action="ver-detalhes"]');
      if (botaoDetalhes) {
        botaoDetalhes.addEventListener("click", () => {
          window.verDetalhes(item);
        });
      }

      lista.appendChild(div);

    });

  }

  // 🔄 FILTRAR
  window.filtrar = function (status) {

    statusAtual = status;

    atualizarBotoesAtivos();

    carregarAgendamentos();

  };

  // ✅ CONCLUIR
  window.concluir = async function (id) {

    const { error } =
      await supabase
        .from("appointments")
        .update({
          status: "done"
        })
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {

      console.log(error);

      alert("Erro ao concluir");

      return;
    }

    carregarAgendamentos();

  };

  // ❌ CANCELAR
  window.cancelar = async function (id) {

    const { error } =
      await supabase
        .from("appointments")
        .update({
          status: "cancelled"
        })
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {

      console.log(error);

      alert("Erro ao cancelar");

      return;
    }

    carregarAgendamentos();

  };
// 👁️ VER DETALHES
function escaparHTML(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizarFotos(fotos) {
  if (!fotos) return [];

  let listaFotos = fotos;

  if (typeof listaFotos === "string") {
    const texto = listaFotos.trim();
    if (!texto) return [];

    try {
      listaFotos = JSON.parse(texto);
    } catch {
      // Também aceita uma única URL salva como texto.
      listaFotos = [texto];
    }
  }

  if (!Array.isArray(listaFotos)) {
    listaFotos = [listaFotos];
  }

  return listaFotos
    .map(foto => {
      if (typeof foto === "string") return foto.trim();
      if (foto && typeof foto === "object") {
        return String(foto.url || foto.publicUrl || foto.public_url || "").trim();
      }
      return "";
    })
    .filter(url => /^https?:\/\//i.test(url));
}

window.verDetalhes = function(item) {
  if (!item || typeof item !== "object") {
    console.error("Não foi possível abrir os detalhes do agendamento:", item);
    return;
  }

  const fotos = normalizarFotos(item.photo_urls);
  const modal = document.createElement("div");

  modal.className = `
    fixed inset-0 bg-black/70 backdrop-blur-sm
    flex items-center justify-center z-50 p-4
  `;

  const nome = escaparHTML(item.name || "Cliente");
  const servico = escaparHTML(item.service || "Não informado");
  const telefone = escaparHTML(item.phone || "Não informado");
  const data = escaparHTML(item.date || "Não informada");
  const horario = escaparHTML(item.time || "Não informado");
  const descricao = escaparHTML(item.description || "");

  modal.innerHTML = `
    <div class="
      bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl
      relative max-h-[90vh] overflow-y-auto
    ">
      <button
        id="fecharModal"
        type="button"
        aria-label="Fechar detalhes"
        class="absolute top-4 right-4 text-2xl text-gray-500 hover:text-black"
      ><i data-lucide="x" class="icon"></i></button>

      <h2 class="text-2xl font-bold mb-5 pr-8 text-gray-900">${nome}</h2>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div class="rounded-2xl bg-gray-50 p-4">
          <p class="text-xs uppercase tracking-wide text-gray-500">Serviço</p>
          <p class="font-semibold text-gray-800 mt-1">${servico}</p>
        </div>
        <div class="rounded-2xl bg-gray-50 p-4">
          <p class="text-xs uppercase tracking-wide text-gray-500">Telefone</p>
          <p class="font-semibold text-gray-800 mt-1">${telefone}</p>
        </div>
        <div class="rounded-2xl bg-gray-50 p-4">
          <p class="text-xs uppercase tracking-wide text-gray-500">Data</p>
          <p class="font-semibold text-gray-800 mt-1">${data}</p>
        </div>
        <div class="rounded-2xl bg-gray-50 p-4">
          <p class="text-xs uppercase tracking-wide text-gray-500">Horário</p>
          <p class="font-semibold text-gray-800 mt-1">${horario}</p>
        </div>
      </div>

      ${descricao ? `
        <div class="mb-6">
          <h3 class="font-bold text-lg mb-2 text-gray-900">Descrição</h3>
          <div class="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-gray-700 whitespace-pre-wrap">${descricao}</div>
        </div>
      ` : ""}

      <div class="mb-2">
        <h3 class="font-bold text-lg mb-3 text-gray-900">Fotos ${fotos.length ? `(${fotos.length})` : ""}</h3>
        ${fotos.length ? `
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            ${fotos.map((url, index) => `
              <a href="${escaparHTML(url)}" target="_blank" rel="noopener noreferrer"
                 class="block overflow-hidden rounded-2xl bg-gray-100">
                <img src="${escaparHTML(url)}" alt="Foto ${index + 1} do agendamento"
                     loading="lazy"
                     class="w-full h-40 sm:h-48 object-cover hover:scale-105 transition"
                     onerror="this.closest('a').style.display='none'">
              </a>
            `).join("")}
          </div>
        ` : `
          <p class="text-sm text-gray-400 bg-gray-50 rounded-2xl p-4">Nenhuma foto enviada.</p>
        `}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons({ root: modal });

  modal.querySelector("#fecharModal").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
};

  // 🚀 INICIAR
  atualizarBotoesAtivos();

  carregarAgendamentos();

});
