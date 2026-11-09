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

    if (!data || data.length === 0) {

      lista.innerHTML = `
        <div class="bg-white p-8 rounded-3xl text-center shadow">
          <p class="text-[#696969]">
            Nenhum serviço cadastrado
          </p>
        </div>
      `;

      return;
    }

    lista.innerHTML = "";

    data.forEach(servico => {

      const div =
        document.createElement("div");

      div.className = `
        bg-white
        p-5
        rounded-3xl
        shadow-md
        flex
        justify-between
        items-center
      `;

      div.innerHTML = `

        <div>

          <h2 class="font-bold text-lg">
            ${servico.name}
          </h2>

          <p class="text-[#696969] mt-1">
            <i data-lucide="wallet" class="inline-block w-4 h-4 mr-1 align-[-3px]"></i>R$${Number(servico.price).toFixed(2)}
          </p>

          <p class="text-[#808080] text-sm">
            <i data-lucide="clock" class="inline-block w-4 h-4 mr-1 align-[-3px]"></i> ${servico.duration} min
          </p>

          ${
            servico.description
              ? `
                <button
                  onclick="toggleDescricao(${servico.id})"
                  class="
                    text-sm
                    text-[#696969]
                    mt-2
                    underline
                  "
                >
                  <i data-lucide="chevron-down" class="inline-block w-4 h-4 mr-1 align-[-3px]"></i> Ver descrição
                </button>
          
                <div
                  id="descricao-${servico.id}"
                  class="hidden mt-2"
                >
          
                  <p class="
                    text-[#696969]
                    text-sm
                    whitespace-pre-wrap
                    mb-3
                  ">
                    <i data-lucide="file-text" class="inline-block w-4 h-4 mr-1 align-[-3px]"></i> ${servico.description}
                  </p>
          
                  <button
                    onclick="mostrarEdicao(${servico.id})"
                    class="
                      text-sm
                      text-blue-600
                      underline
                      mb-2
                    "
                  >
                    <i data-lucide="pencil" class="inline-block w-4 h-4 mr-1 align-[-3px]"></i> Editar descrição
                  </button>
          
                  <div
                    id="editar-${servico.id}"
                    class="hidden"
                  >
          
                    <textarea
                      id="textarea-${servico.id}"
                      class="
                        w-full
                        border
                        border-[#696969]
                        rounded-2xl
                        p-3
                        text-sm
                        h-28
                        resize-none
                      "
                    >${servico.description}</textarea>
          
                    <button
                      onclick="salvarDescricao(${servico.id})"
                      class="
                        mt-2
                        bg-[#696969]
                        text-white
                        px-4
                        py-2
                        rounded-2xl
                        text-sm
                      "
                    >
                      Salvar descrição
                    </button>
          
                  </div>
          
                </div>
              `
              : ""
          }
          
        </div>

        <div class="flex gap-2">

          <button
            onclick="toggleServico(${servico.id}, ${servico.active})"
            class="
              px-4
              py-2
              rounded-2xl
              text-white
              font-semibold
              ${servico.active ? 'bg-yellow-500' : 'bg-green-500'}
            "
          >
            ${servico.active ? 'Desativar' : 'Ativar'}
          </button>

          <button
            onclick="deletarServico(${servico.id})"
            class="
              px-4
              py-2
              rounded-2xl
              bg-red-500
              text-white
              font-semibold
            "
          >
            Excluir
          </button>

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

  if (!data || data.length === 0) {

    listaAddons.innerHTML = `
      <div class="bg-white p-6 rounded-3xl shadow text-center">
        Nenhum adicional cadastrado
      </div>
    `;

    return;
  }

  listaAddons.innerHTML = "";

  data.forEach(addon => {

    const div =
      document.createElement("div");

    div.className = `
      bg-white
      p-5
      rounded-3xl
      shadow-md
      flex
      justify-between
      items-center
    `;

    div.innerHTML = `

      <div>
    
        <h2 class="font-bold text-lg">
          <i data-lucide="sparkles" class="inline-block w-4 h-4 mr-1 align-[-3px] text-pink-400"></i> ${addon.name}
        </h2>
    
        <p class="text-[#696969] mt-1">
          <i data-lucide="wallet" class="inline-block w-4 h-4 mr-1 align-[-3px]"></i>R$${Number(addon.price).toFixed(2)}
        </p>
    
        <p class="text-[#808080] text-sm">
          <i data-lucide="clock" class="inline-block w-4 h-4 mr-1 align-[-3px]"></i> ${addon.duration} min
        </p>
    
      </div>
    
      <div class="flex gap-2">
    
        <button
          onclick="toggleAddon('${addon.id}', ${addon.active})"
          class="
            px-4
            py-2
            rounded-2xl
            text-white
            font-semibold
            ${addon.active ? 'bg-yellow-500' : 'bg-green-500'}
          "
        >
          ${addon.active ? 'Desativar' : 'Ativar'}
        </button>
    
        <button
          onclick="deletarAddon('${addon.id}')"
          class="
            px-4
            py-2
            rounded-2xl
            bg-red-500
            text-white
            font-semibold
          "
        >
          Excluir
        </button>
    
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
window.toggleDescricao = function(id) {

  const div =
    document.getElementById(
      `descricao-${id}`
    );

  const button =
    event.target;

  if (div.classList.contains("hidden")) {

    div.classList.remove("hidden");

    button.innerHTML =
      '<i data-lucide="chevron-up" class="inline-block w-4 h-4 mr-1 align-[-3px]"></i> Ocultar descrição';
    if (window.lucide) window.lucide.createIcons({ root: button });

  } else {

    div.classList.add("hidden");

    button.innerHTML =
      '<i data-lucide="chevron-down" class="inline-block w-4 h-4 mr-1 align-[-3px]"></i> Ver descrição';
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
