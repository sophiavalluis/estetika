document.addEventListener("DOMContentLoaded", async () => {

  const supabase = window.supabase.createClient(
    "https://bjaurtrqrasznuptthyf.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqYXVydHJxcmFzem51cHR0aHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDkwNTIsImV4cCI6MjA5MzQ4NTA1Mn0.iCQyvzAJykzgLO4kZkJZ8qNbv3549rG_JuwcVEZDrKA"
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return (window.location.href = "/login/");

  const el = (id) => document.getElementById(id);
  window.lucide?.createIcons();

  // Relógio digital da área do studio (horário local do dispositivo).
  const clock = document.getElementById("digitalClock");
  const updateClock = () => {
    if (!clock) return;
    clock.textContent = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    }).format(new Date());
  };
  updateClock();
  setInterval(updateClock, 1000);

  const studioInput = el("studio");
  const usernameInput = el("username");
  const preview = el("preview");
  const studioTitle = el("studioTitle");
  const publicLink = el("publicLink");
  const editCard = el("editCard");
  const availabilityList = el("availabilityList");
  const backgroundBlur = el("backgroundBlur");
  const themeColorInput = el("themeColor");
  const logoPreview = el("logoCurrentPreview");
  const backgroundPreview = el("backgroundCurrentPreview");
  let removeLogoRequested = false;
  let removeBackgroundRequested = false;

  const applyTheme = (color) => {
    document.documentElement.style.setProperty("--rose", color);
    document.documentElement.style.setProperty("--rose-dark", color);
     document.querySelectorAll(".btn-primary, #copiar, #saveSettings").forEach(button => { button.style.backgroundColor = color; button.style.boxShadow = `0 7px 16px ${color}2b`; });
    el("themePalette")?.querySelectorAll(".color-swatch").forEach(button => {
      button.classList.toggle("selected", button.dataset.color.toLowerCase() === color.toLowerCase());
    });
  };

  const updateBackgroundPreview = (url) => {
    backgroundPreview.src = url || "https://placehold.co/600x180/png?text=Sem+imagem+de+fundo";
    backgroundBlur.style.backgroundImage = url ? `url("${url}")` : "linear-gradient(135deg, #fbe4d8, #f8d7e0)";
  };

  const updateLogoPreview = (url) => {
    const fallback = "https://placehold.co/96x96/png?text=Logo";
    logoPreview.src = url || fallback;
    preview.src = url || fallback;
  };

  const getStoragePath = (publicUrl, bucket) => {
    if (!publicUrl) return null;
    try {
      const marker = `/storage/v1/object/public/${bucket}/`;
      const index = publicUrl.indexOf(marker);
      return index >= 0 ? decodeURIComponent(publicUrl.slice(index + marker.length).split("?")[0]) : null;
    } catch { return null; }
  };

  let profileData = null;

  // ================= PROFILE =================
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar profile:", error);
    return;
  }

  if (!profile) {
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      studio_name: "Meu Studio",
      username: `user_${user.id.slice(0, 6)}`,
      theme_color: "#CFCFCF",
      logo_url: null,
      background_url: null,
      capacity: 1,
      slot_interval: 30,
      created_at: new Date().toISOString()
    });

    if (insertError) {
      console.error("Erro ao criar profile:", insertError);
      return;
    }

    location.reload();
    return;
  }

  profileData = profile;

  // ================= UI PROFILE =================

  studioInput.value = profile.studio_name || "";
  usernameInput.value = profile.username || "";
  studioTitle.textContent = profile.studio_name || "Meu Studio";

  updateLogoPreview(profile.logo_url);
  el("logoStatus").textContent = profile.logo_url ? "Logo atual carregada." : "Nenhuma logo carregada.";
  el("backgroundStatus").textContent = profile.background_url ? "Imagem de fundo atual carregada." : "Nenhuma imagem de fundo carregada.";
  backgroundPreview.src = profile.background_url || "https://placehold.co/600x180/png?text=Sem+imagem+de+fundo";

  const theme = profile.theme_color || "#CFCFCF";
  themeColorInput.value = theme;
  applyTheme(theme);

  if (profile.background_url) {
    backgroundBlur.style.backgroundImage = `url('${profile.background_url}')`;
  } else {
    backgroundBlur.style.backgroundImage =
      "linear-gradient(135deg, #fbe4d8, #f8d7e0)";
  }

  el("themePalette").querySelectorAll(".color-swatch").forEach(button => {
    button.addEventListener("click", () => {
      themeColorInput.value = button.dataset.color;
      applyTheme(button.dataset.color);
    });
  });

  el("logoFile").addEventListener("change", () => {
    const file = el("logoFile").files?.[0];
    if (file) {
      removeLogoRequested = false;
      updateLogoPreview(URL.createObjectURL(file));
      el("logoStatus").textContent = `Nova logo selecionada: ${file.name}`;
    }
  });

  el("backgroundFile").addEventListener("change", () => {
    const file = el("backgroundFile").files?.[0];
    if (file) {
      removeBackgroundRequested = false;
      const url = URL.createObjectURL(file);
      backgroundPreview.src = url;
      backgroundBlur.style.backgroundImage = `url("${url}")`;
      el("backgroundStatus").textContent = `Nova imagem selecionada: ${file.name}`;
    }
  });

  el("removeLogo").addEventListener("click", () => {
    removeLogoRequested = true;
    el("logoFile").value = "";
    updateLogoPreview(null);
    el("logoStatus").textContent = "A logo será removida ao salvar.";
  });

  el("removeBackground").addEventListener("click", () => {
    removeBackgroundRequested = true;
    el("backgroundFile").value = "";
    updateBackgroundPreview(null);
    el("backgroundStatus").textContent = "A imagem de fundo será removida ao salvar.";
  });

  const usernameRaw = (profile.username || "").trim();
  const safeUsername = encodeURIComponent(usernameRaw || "usuario");

  const fullLink =
    `https://agenda-beleza-eta.vercel.app/agendamento.html?studio=${safeUsername}`;

  publicLink.innerHTML = `
    <a href="${fullLink}"
       target="_blank"
       class="text-[#A9A9A9] break-all font-semibold">
      ${fullLink}
    </a>
  `;

  const copyAgendaLink = async (link) => {
    const button = el("copiar");
    const originalText = "▣  Copiar link";
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        const temp = document.createElement("textarea");
        temp.value = link;
        temp.setAttribute("readonly", "");
        temp.style.position = "fixed";
        temp.style.opacity = "0";
        document.body.appendChild(temp);
        temp.select();
        const copied = document.execCommand("copy");
        temp.remove();
        if (!copied) throw new Error("Não foi possível copiar automaticamente.");
      }
      button.textContent = "Copiado!";
      button.setAttribute("aria-label", "Link copiado");
      window.setTimeout(() => {
        button.textContent = originalText;
        button.removeAttribute("aria-label");
      }, 1800);
    } catch (err) {
      console.error("Erro ao copiar link:", err);
      button.textContent = "Selecione o link acima";
      window.setTimeout(() => button.textContent = originalText, 2200);
    }
  };
  el("copiar").onclick = () => copyAgendaLink(fullLink);

  el("abrirAgenda").onclick = () => window.open(fullLink, "_blank");

  ["copiar", "salvar", "saveSettings"].forEach(id => {
    const b = el(id);
    if (b) b.style.background = theme;
  });

  // ================= EDIT TOGGLE =================
  el("editarBtn").addEventListener("click", () => {
    editCard.classList.toggle("hidden");
  });

  // ================= SAVE PROFILE =================
  el("salvar").onclick = async () => {

    const msg = el("msg");
    msg.textContent = "Salvando...";

    let logo_url = profileData?.logo_url || null;
    let background_url = profileData?.background_url || null;

    const logoFile = el("logoFile")?.files?.[0];
    const backgroundFile = el("backgroundFile")?.files?.[0];

    const studio_name = studioInput.value;
    const username = usernameInput.value;
    const theme_color = themeColorInput.value;

    try {

      if (logoFile) {
        const path = `logos/${user.id}-${Date.now()}`;
        const { error: uploadError } = await supabase.storage.from("logos").upload(path, logoFile, { upsert: true });
        if (uploadError) throw uploadError;
        logo_url = supabase.storage.from("logos").getPublicUrl(path).data.publicUrl;
      }

      if (backgroundFile) {
        const path = `backgrounds/${user.id}-${Date.now()}`;
        const { error: uploadError } = await supabase.storage.from("backgrounds").upload(path, backgroundFile, { upsert: true });
        if (uploadError) throw uploadError;
        background_url = supabase.storage.from("backgrounds").getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase.from("profiles").update({
        studio_name,
        username,
        logo_url,
        background_url,
        theme_color
      }).eq("id", user.id);

      if (error) throw error;

      // Atualiza imediatamente a interface sem recarregar a página.
      profileData = { ...profileData, studio_name, username, logo_url, background_url, theme_color };
      studioTitle.textContent = studio_name || "Meu Studio";
      updateLogoPreview(logo_url);
      updateBackgroundPreview(background_url);
      applyTheme(theme_color);
      el("logoStatus").textContent = logo_url ? "Logo atual carregada." : "Nenhuma logo carregada.";
      el("backgroundStatus").textContent = background_url ? "Imagem de fundo atual carregada." : "Nenhuma imagem de fundo carregada.";
      el("logoFile").value = "";
      el("backgroundFile").value = "";
      removeLogoRequested = false;
      removeBackgroundRequested = false;

      const updatedUsername = encodeURIComponent((username || "").trim() || "usuario");
      const updatedLink = `https://agenda-beleza-eta.vercel.app/agendamento.html?studio=${updatedUsername}`;
      publicLink.innerHTML = `<a href="${updatedLink}" target="_blank" class="text-[#A9A9A9] break-all font-semibold">${updatedLink}</a>`;
      el("abrirAgenda").onclick = () => window.open(updatedLink, "_blank");
      el("copiar").onclick = () => copyAgendaLink(updatedLink);

      // Remove arquivos antigos somente depois de o perfil ser salvo.
      if (oldLogoUrl && oldLogoUrl !== logo_url) {
        const oldPath = getStoragePath(oldLogoUrl, "logos");
        if (oldPath) {
          const { error: removeError } = await supabase.storage.from("logos").remove([oldPath]);
          if (removeError) console.warn("Perfil salvo, mas não foi possível remover a logo antiga:", removeError);
        }
      }
      if (oldBackgroundUrl && oldBackgroundUrl !== background_url) {
        const oldPath = getStoragePath(oldBackgroundUrl, "backgrounds");
        if (oldPath) {
          const { error: removeError } = await supabase.storage.from("backgrounds").remove([oldPath]);
          if (removeError) console.warn("Perfil salvo, mas não foi possível remover a imagem antiga:", removeError);
        }
      }

      msg.textContent = "Salvo com sucesso! Tudo atualizado.";
    } catch (err) {
      console.error(err);
      msg.textContent = err.message || "Erro ao salvar. Confira os arquivos e tente novamente.";
    }
  };

  // ================= SETTINGS =================
  const { data: config } = await supabase
    .from("profiles")
    .select("capacity, slot_interval")
    .eq("id", user.id)
    .maybeSingle();

  if (config) {
    el("capacity").value = config.capacity || 1;
    el("slotInterval").value = config.slot_interval || 30;
  }

  el("saveSettings").onclick = async () => {
    const button = el("saveSettings");
    const originalText = "Salvar configurações";
    button.disabled = true;
    button.textContent = "Salvando...";
    try {
      const capacity = Math.max(1, parseInt(el("capacity").value, 10) || 1);
      const slot_interval = parseInt(el("slotInterval").value, 10) || 30;
      const { error } = await supabase.from("profiles").update({
        capacity, slot_interval
      }).eq("id", user.id);
      if (error) throw error;
      button.textContent = "Salvo!";
      alert("Configurações salvas!");
    } catch (err) {
      console.error("Erro ao salvar configurações:", err);
      alert(err.message || "Não foi possível salvar as configurações.");
      button.textContent = "Tentar novamente";
    } finally {
      button.disabled = false;
      window.setTimeout(() => button.textContent = originalText, 1800);
    }
  };

  // ================= AVAILABILITY =================
  // Mantém o mesmo formato usado pela tela antiga de disponibilidade:
  // weekday (texto), open_time, close_time e chairs.
  const dias = [
    { key: "monday", label: "Segunda-feira" },
    { key: "tuesday", label: "Terça-feira" },
    { key: "wednesday", label: "Quarta-feira" },
    { key: "thursday", label: "Quinta-feira" },
    { key: "friday", label: "Sexta-feira" },
    { key: "saturday", label: "Sábado" },
    { key: "sunday", label: "Domingo" }
  ];

  const saveAvailabilityBtn = el("saveAvailability");
  const availabilityMsg = el("availabilityMsg");

  async function loadAvailability() {
    availabilityList.innerHTML = "";

    const { data, error } = await supabase
      .from("availability")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao carregar disponibilidade:", error);
      availabilityList.innerHTML = '<p class="subtle">Não foi possível carregar os horários.</p>';
      return;
    }

    dias.forEach(dia => {
      const item = data?.find(row => row.weekday === dia.key);
      const card = document.createElement("div");
      card.className = "availability-day";
      card.dataset.weekday = dia.key;
      card.innerHTML = `
        <div class="flex items-center justify-between gap-3 mb-3">
          <b>${dia.label}</b>
          <label class="flex items-center gap-2">
            <span>Atender</span>
            <input type="checkbox" class="availability-active" ${item ? "checked" : ""}>
          </label>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <label>Abre
            <input type="time" class="availability-open field mt-1" value="${item?.open_time || "09:00"}">
          </label>
          <label>Fecha
            <input type="time" class="availability-close field mt-1" value="${item?.close_time || "18:00"}">
          </label>
        </div>
        <label class="field-label mt-3">Quantidade de cadeiras
          <input type="number" min="1" class="availability-chairs field mt-1" value="${item?.chairs || 1}">
        </label>
      `;
      availabilityList.appendChild(card);
    });
  }

  saveAvailabilityBtn?.addEventListener("click", async () => {
    saveAvailabilityBtn.disabled = true;
    availabilityMsg.textContent = "Salvando disponibilidade...";

    try {
      const rows = [];
      availabilityList.querySelectorAll("[data-weekday]").forEach(card => {
        if (!card.querySelector(".availability-active").checked) return;

        const open_time = card.querySelector(".availability-open").value;
        const close_time = card.querySelector(".availability-close").value;
        const chairs = Math.max(1, Number(card.querySelector(".availability-chairs").value) || 1);

        if (!open_time || !close_time || open_time >= close_time) {
          throw new Error(`Confira os horários de ${card.querySelector("b").textContent}: o horário de fechamento deve ser depois da abertura.`);
        }

        rows.push({
          user_id: user.id,
          weekday: card.dataset.weekday,
          open_time,
          close_time,
          chairs
        });
      });

      const { error: deleteError } = await supabase
        .from("availability")
        .delete()
        .eq("user_id", user.id);
      if (deleteError) throw deleteError;

      if (rows.length) {
        const { error: insertError } = await supabase
          .from("availability")
          .insert(rows);
        if (insertError) throw insertError;
      }

      availabilityMsg.textContent = "Disponibilidade salva com sucesso!";
    } catch (err) {
      console.error("Erro ao salvar disponibilidade:", err);
      availabilityMsg.textContent = err.message || "Erro ao salvar disponibilidade.";
    } finally {
      saveAvailabilityBtn.disabled = false;
    }
  });

  loadAvailability();

});
