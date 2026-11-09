document.addEventListener("DOMContentLoaded", async () => {

  const supabase = window.supabase.createClient(
    "https://bjaurtrqrasznuptthyf.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqYXVydHJxcmFzem51cHR0aHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDkwNTIsImV4cCI6MjA5MzQ4NTA1Mn0.iCQyvzAJykzgLO4kZkJZ8qNbv3549rG_JuwcVEZDrKA"
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return (window.location.href = "/login/");

  const el = (id) => document.getElementById(id);

  const studioInput = el("studio");
  const usernameInput = el("username");
  const preview = el("preview");
  const studioTitle = el("studioTitle");
  const publicLink = el("publicLink");
  const editCard = el("editCard");
  const availabilityList = el("availabilityList");
  const backgroundBlur = el("backgroundBlur");
  const themeColorInput = el("themeColor");

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

  if (profile.logo_url) preview.src = profile.logo_url;

  const theme = profile.theme_color || "#CFCFCF";
  themeColorInput.value = theme;

  if (profile.background_url) {
    backgroundBlur.style.backgroundImage = `url('${profile.background_url}')`;
  } else {
    backgroundBlur.style.backgroundImage =
      "linear-gradient(135deg, #fbe4d8, #f8d7e0)";
  }

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

  el("copiar").onclick = async () => {
    try {
      await navigator.clipboard.writeText(fullLink);
      el("copiar").textContent = "Copiado!";
      setTimeout(() => (el("copiar").textContent = "Copiar Link"), 1200);
    } catch {
      const temp = document.createElement("input");
      document.body.appendChild(temp);
      temp.value = fullLink;
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
    }
  };

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
        await supabase.storage.from("logos").upload(path, logoFile, { upsert: true });
        logo_url = supabase.storage.from("logos").getPublicUrl(path).data.publicUrl;
      }

      if (backgroundFile) {
        const path = `backgrounds/${user.id}-${Date.now()}`;
        await supabase.storage.from("backgrounds").upload(path, backgroundFile, { upsert: true });
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

      msg.textContent = "Salvo com sucesso!";

    } catch (err) {
      console.error(err);
      msg.textContent = "Erro ao salvar";
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
    await supabase.from("profiles").update({
      capacity: parseInt(el("capacity").value),
      slot_interval: parseInt(el("slotInterval").value)
    }).eq("id", user.id);

    alert("Configurações salvas!");
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
