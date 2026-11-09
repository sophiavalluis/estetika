document.addEventListener("DOMContentLoaded", async () => {

  const supabase = window.supabase.createClient(
    "https://bjaurtrqrasznuptthyf.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqYXVydHJxcmFzem51cHR0aHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDkwNTIsImV4cCI6MjA5MzQ4NTA1Mn0.iCQyvzAJykzgLO4kZkJZ8qNbv3549rG_JuwcVEZDrKA"
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return (window.location.href = "login.html");

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
  const dias = ["Dom","Seg","Ter","Qua","Qui","Sex","Sab"];

  async function loadAvailability() {

    availabilityList.innerHTML = "";

    const { data } = await supabase
      .from("availability")
      .select("*")
      .eq("user_id", user.id);

    for (let i = 0; i < 7; i++) {

      const d = data?.find(x => x.weekday === i);

      const div = document.createElement("div");
      div.className = "border p-3 rounded-2xl";

            div.innerHTML = `
        <div class="flex items-center justify-between mb-3">
      
          <b class="text-lg">${dias[i]}</b>
      
          <label class="flex items-center gap-2 text-sm">
      
            <span>Aberto</span>
      
            <input
              type="checkbox"
              id="active-${i}"
              class="w-5 h-5"
              ${d?.active !== false ? "checked" : ""}
            >
      
          </label>
      
        </div>
      
        <div class="grid grid-cols-2 gap-2">
      
          <input
            type="time"
            id="start-${i}"
            value="${d?.start_time || "09:00"}"
            class="border p-2 rounded-xl"
          >
      
          <input
            type="time"
            id="end-${i}"
            value="${d?.end_time || "18:00"}"
            class="border p-2 rounded-xl"
          >
      
        </div>
      `;

      availabilityList.appendChild(div);
    }
  }

  loadAvailability();

});