document.addEventListener("DOMContentLoaded", async () => {

  // 🔗 SUPABASE
  const supabase =
    window.supabase.createClient(
      "https://nxbqhwubyeayzgnncxsk.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YnFod3VieWVheXpnbm5jeHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NDcyODIsImV4cCI6MjEwNzUyMzI4Mn0.pjHTY7d3Nxwo-bX4JOAjy6plkbhVkb3MhXZTA-Fq4qM"
    );

  // 🔐 USER
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {

    window.location.href =
      "/login/";

    return;
  }

  // 📦 ELEMENTOS
  const lista =
    document.getElementById("lista");

  const listaAddons =
    document.getElementById("listaAddons");

  const btnSalvar =
    document.getElementById("salvar");

  const btnSalvarAddon =
    document.getElementById("salvarAddon");

  const totalServicos = document.getElementById("totalServicos");
  const totalAddons = document.getElementById("totalAddons");

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function formatarPreco(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency", currency: "BRL"
    });
  }

  // 📥 CARREGAR
  async function carregarServicos() {

    lista.innerHTML = `
      <div class="text-center text-gray-500">
        Carregando...
      </div>
    `;

    const {
      data,
      error
    } = await supabase
      .from("services")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false
      });

    if (error) {

      console.log(error);

      lista.innerHTML = `
        <div class="text-red-500">
          Erro ao carregar
        </div>
      `;

      return;
    }

    totalServicos.textContent = data?.length || 0;

    if (!data || data.length === 0) {

      lista.innerHTML = `
        <div class="col-span-full rounded-2xl border border-dashed border-[#e7dce2] bg-white p-9 text-center">
          <div class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#f9edf2] text-[#a95f7b]"><i data-lucide="scissors" class="h-5 w-5"></i></div>
          <p class="font-bold text-[#514751]">Seu catálogo começa aqui</p>
          <p class="mt-1 text-sm text-[#89818a]">Cadastre seu primeiro serviço usando o formulário acima.</p>
        </div>
      `;

      return;
    }

    lista.innerHTML = "";

    data.forEach(servico => {

      const div =
        document.createElement("div");

      div.className = "service-card";
      const nome = escapeHTML(servico.name);
      const descricao = escapeHTML(servico.description || "");
      const ativo = !!servico.active;

      div.innerHTML = `
        <div class="flex h-full flex-col">
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-3">
              <div class="icon-tile"><i data-lucide="scissors" class="h-5 w-5"></i></div>
              <div class="min-w-0">
                <h3 class="break-words text-base font-extrabold text-[#302832]">${nome}</h3>
                <span class="mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${ativo ? 'text-[#6f9b86]' : 'text-[#a19aa0]'}">
                  <span class="h-1.5 w-1.5 rounded-full ${ativo ? 'bg-[#6f9b86]' : 'bg-[#b8b1b7]'}"></span>
                  ${ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
            <span class="shrink-0 rounded-xl bg-[#f9edf2] px-3 py-2 text-sm font-extrabold text-[#a95f7b]">${formatarPreco(servico.price)}</span>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <span class="meta-pill"><i data-lucide="clock-3" class="h-3.5 w-3.5"></i>${escapeHTML(servico.duration)} min</span>
            <span class="meta-pill"><i data-lucide="wallet" class="h-3.5 w-3.5"></i>Valor por atendimento</span>
          </div>

          ${descricao ? `
            <div class="mt-3 border-t border-[#f1ebee] pt-3">
              <button onclick="toggleDescricao(${servico.id}, this)" class="inline-flex items-center gap-1.5 text-xs font-bold text-[#a95f7b] hover:text-[#884760]">
                <i data-lucide="chevron-down" class="h-4 w-4"></i> Ver descrição
              </button>
              <div id="descricao-${servico.id}" class="hidden mt-3">
                <p class="whitespace-pre-wrap text-xs leading-5 text-[#817781]">${descricao}</p>
                <button onclick="mostrarEdicao(${servico.id})" class="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#8873a6]">
                  <i data-lucide="pencil" class="h-3.5 w-3.5"></i> Editar descrição
                </button>
                <div id="editar-${servico.id}" class="hidden mt-2">
                  <textarea id="textarea-${servico.id}" class="field min-h-24 resize-y text-sm">${descricao}</textarea>
                  <button onclick="salvarDescricao(${servico.id})" class="mt-2 rounded-lg bg-[#8873a6] px-3 py-2 text-xs font-bold text-white">Salvar descrição</button>
                </div>
              </div>
            </div>
          ` : ''}

          <div class="mt-auto flex flex-wrap gap-2 border-t border-[#f1ebee] pt-4 ${descricao ? 'mt-4' : 'mt-5'}">
            <button onclick="toggleServico(${servico.id}, ${ativo})" class="action ${ativo ? 'bg-[#fbf3e5] text-[#a77b32]' : 'bg-[#edf5f0] text-[#56816a]'}">
              <i data-lucide="${ativo ? 'pause' : 'play'}" class="h-3.5 w-3.5"></i>${ativo ? 'Desativar' : 'Ativar'}
            </button>
            <button onclick="deletarServico(${servico.id})" class="action bg-[#fbf0f2] text-[#b36c7d]">
              <i data-lucide="trash-2" class="h-3.5 w-3.5"></i>Excluir
            </button>
          </div>
        </div>
      `;

      lista.appendChild(div);
      if (window.lucide) window.lucide.createIcons({ root: div });

    });

  }

// 📥 CARREGAR ADICIONAIS
async function carregarAddons() {

  listaAddons.innerHTML = `
    <div class="text-center text-gray-500">
      Carregando adicionais...
    </div>
  `;

  const {
    data,
    error
  } = await supabase
    .from("service_addons")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false
    });

  if (error) {

    console.log(error);

    listaAddons.innerHTML = `
      <div class="text-red-500">
        Erro ao carregar adicionais
      </div>
    `;

    return;
  }

  totalAddons.textContent = data?.length || 0;

  if (!data || data.length === 0) {

    listaAddons.innerHTML = `
      <div class="col-span-full rounded-2xl border border-dashed border-[#e7dce2] bg-white p-9 text-center">
        <div class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-[#f1edf8] text-[#8873a6]"><i data-lucide="sparkles" class="h-5 w-5"></i></div>
        <p class="font-bold text-[#514751]">Nenhum adicional por enquanto</p>
        <p class="mt-1 text-sm text-[#89818a]">Cadastre extras para oferecer mais opções no agendamento.</p>
      </div>
    `;

    return;
  }

  listaAddons.innerHTML = "";

  data.forEach(addon => {

    const div =
      document.createElement("div");

    div.className = "service-card";
    const nome = escapeHTML(addon.name);
    const ativo = !!addon.active;

    div.innerHTML = `
      <div class="flex h-full flex-col">
        <div class="flex items-start justify-between gap-3">
          <div class="flex min-w-0 items-start gap-3">
            <div class="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[14px] bg-[#f1edf8] text-[#8873a6]"><i data-lucide="sparkles" class="h-5 w-5"></i></div>
            <div class="min-w-0">
              <h3 class="break-words text-base font-extrabold text-[#302832]">${nome}</h3>
              <span class="mt-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${ativo ? 'text-[#6f9b86]' : 'text-[#a19aa0]'}">
                <span class="h-1.5 w-1.5 rounded-full ${ativo ? 'bg-[#6f9b86]' : 'bg-[#b8b1b7]'}"></span>
                ${ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
          <span class="shrink-0 rounded-xl bg-[#f1edf8] px-3 py-2 text-sm font-extrabold text-[#8873a6]">${formatarPreco(addon.price)}</span>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <span class="meta-pill"><i data-lucide="clock-3" class="h-3.5 w-3.5"></i>+ ${escapeHTML(addon.duration)} min</span>
          <span class="meta-pill"><i data-lucide="plus-circle" class="h-3.5 w-3.5"></i>Adicional</span>
        </div>
        <div class="mt-auto flex flex-wrap gap-2 border-t border-[#f1ebee] pt-4 mt-5">
          <button onclick="toggleAddon('${addon.id}', ${ativo})" class="action ${ativo ? 'bg-[#fbf3e5] text-[#a77b32]' : 'bg-[#edf5f0] text-[#56816a]'}">
            <i data-lucide="${ativo ? 'pause' : 'play'}" class="h-3.5 w-3.5"></i>${ativo ? 'Desativar' : 'Ativar'}
          </button>
          <button onclick="deletarAddon('${addon.id}')" class="action bg-[#fbf0f2] text-[#b36c7d]">
            <i data-lucide="trash-2" class="h-3.5 w-3.5"></i>Excluir
          </button>
        </div>
      </div>
    `;

    listaAddons.appendChild(div);
    if (window.lucide) window.lucide.createIcons({ root: div });

  });

}


 // 💾 SALVAR
btnSalvar.addEventListener("click", async () => {

  const name =
    document.getElementById("name").value;

  const price =
    document.getElementById("price").value;

  const duration =
    document.getElementById("duration").value;

  const description =
    document.getElementById("description").value;

  if (!name || !price || !duration) {

    alert("Preencha tudo");

    return;
  }

  const { error } =
    await supabase
      .from("services")
      .insert([
        {
          user_id: user.id,
          name,
          price,
          duration,
          description,
          active: true
        }
      ]);

  if (error) {

    console.log(error);

    alert("Erro ao salvar");

    return;
  }

  // LIMPAR
  document.getElementById("name").value = "";
  document.getElementById("price").value = "";
  document.getElementById("duration").value = "";
  document.getElementById("description").value = "";

  carregarServicos();

});


// 💾 SALVAR ADICIONAL
btnSalvarAddon.addEventListener("click", async () => {

  const name =
    document.getElementById("addonName").value;

  const price =
    document.getElementById("addonPrice").value;

  const duration =
    document.getElementById("addonDuration").value;

  if (!name || !price || !duration) {

    alert("Preencha tudo");

    return;
  }

  const { error } =
    await supabase
      .from("service_addons")
      .insert([
        {
          user_id: user.id,
          name,
          price,
          duration,
          active: true
        }
      ]);

  if (error) {

    console.log(error);

    alert("Erro ao salvar adicional");

    return;
  }

  // LIMPAR
  document.getElementById("addonName").value = "";
  document.getElementById("addonPrice").value = "";
  document.getElementById("addonDuration").value = "";

  alert("Adicional salvo!");

  carregarAddons();

});

  // 🔄 ATIVAR/DESATIVAR
  window.toggleServico = async function (id, ativo) {

    await supabase
      .from("services")
      .update({
        active: !ativo
      })
      .eq("id", id)
      .eq("user_id", user.id);

    carregarServicos();

  };

  window.toggleAddon = async function (id, ativo) {

    await supabase
      .from("service_addons")
      .update({
        active: !ativo
      })
      .eq("id", id)
      .eq("user_id", user.id);
  
    carregarAddons();
  
  };

// MOSTRAR / OCULTAR DESCRIÇÃO
window.toggleDescricao = function(id, button) {

  const div =
    document.getElementById(
      `descricao-${id}`
    );

  if (div.classList.contains("hidden")) {

    div.classList.remove("hidden");

    button.innerHTML =
      '<i data-lucide="chevron-up" class="h-4 w-4"></i> Ocultar descrição';
    if (window.lucide) window.lucide.createIcons({ root: button });

  } else {

    div.classList.add("hidden");

    button.innerHTML =
      '<i data-lucide="chevron-down" class="h-4 w-4"></i> Ver descrição';
    if (window.lucide) window.lucide.createIcons({ root: button });


  }

};

// MOSTRAR / OCULTAR EDIÇÃO
window.mostrarEdicao = function(id) {

  const div =
    document.getElementById(
      `editar-${id}`
    );

  div.classList.toggle("hidden");

};

// 💾 SALVAR DESCRIÇÃO
window.salvarDescricao = async function(id) {

  const textarea =
    document.getElementById(
      `textarea-${id}`
    );

  const novaDescricao =
    textarea.value;

  const { error } =
    await supabase
      .from("services")
      .update({
        description: novaDescricao
      })
      .eq("id", id)
      .eq("user_id", user.id);

  if (error) {

    console.log(error);

    alert("Erro ao salvar descrição");

    return;

  }

  carregarServicos();

};

  // ❌ EXCLUIR
  window.deletarServico = async function (id) {

    const confirmar =
      confirm("Excluir serviço?");

    if (!confirmar) return;

    await supabase
      .from("services")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    carregarServicos();

  };

  window.deletarAddon = async function (id) {

    const confirmar =
      confirm("Excluir adicional?");
  
    if (!confirmar) return;
  
    await supabase
      .from("service_addons")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
  
    carregarAddons();
  
  };

  // RODAR O ESCARALHAMENTO(START dos serviços) KKKKK
  carregarServicos();
  carregarAddons();

});
