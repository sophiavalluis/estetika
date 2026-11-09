window.onerror = function(message, source, lineno, colno, error) {
  console.error("Erro no agendamento:", message, source, lineno, colno, error);
};
  
document.addEventListener("DOMContentLoaded", async () => {

  const supabase = window.supabase.createClient(
    "https://nxbqhwubyeayzgnncxsk.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YnFod3VieWVheXpnbm5jeHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NDcyODIsImV4cCI6MjEwNzUyMzI4Mn0.pjHTY7d3Nxwo-bX4JOAjy6plkbhVkb3MhXZTA-Fq4qM"
  );

  const params = new URLSearchParams(window.location.search);
  const username = params.get("studio");

  if (!username) {
    alert("Studio não encontrado");
    return;
  }

  let ownerId = null;
  let slots = [];
  let selectedSlot = null;
  let selectedDuration = 30;

  // 🔵 PERFIL
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) {
    alert("Studio não encontrado");
    return;
  }

  const timesDiv =
  document.getElementById("times");

const addonsArea =
  document.getElementById("addonsArea");

const addonsList =
  document.getElementById("addonsList");

let selectedAddons = [];

  const photosInput = document.getElementById("photos");
  const photoPreview = document.getElementById("photoPreview");
  const photoStatus = document.getElementById("photoStatus");
  const confirmBookingButton = document.getElementById("confirmBooking");

  // Mantém os arquivos entre diferentes aberturas do seletor.
  // O comportamento nativo do input substitui a seleção anterior; aqui somamos
  // os novos arquivos até o limite de 2 imagens.
  let selectedPhotoFiles = [];

  function renderPhotoPreview() {
    if (!photoPreview || !photoStatus) return;
    photoPreview.innerHTML = "";

    selectedPhotoFiles.forEach((file, index) => {
      const item = document.createElement("div");
      item.className = "photo-preview-item";

      const image = document.createElement("img");
      image.alt = `Foto de referência ${index + 1}`;
      image.src = URL.createObjectURL(file);

      const badge = document.createElement("span");
      badge.textContent = `Imagem ${index + 1}`;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.textContent = "×";
      removeButton.setAttribute("aria-label", `Remover imagem ${index + 1}`);
      removeButton.style.cssText = "position:absolute;top:7px;right:7px;width:26px;height:26px;border:0;border-radius:50%;background:rgba(41,36,42,.82);color:#fff;font-size:19px;line-height:1;cursor:pointer;";
      removeButton.addEventListener("click", () => {
        selectedPhotoFiles.splice(index, 1);
        renderPhotoPreview();
      });

      item.append(image, badge, removeButton);
      photoPreview.appendChild(item);
    });

    photoStatus.textContent = selectedPhotoFiles.length
      ? `${selectedPhotoFiles.length} de 2 imagens selecionadas. Você ainda pode adicionar ${2 - selectedPhotoFiles.length}.`
      : "Você pode anexar até 2 imagens.";
  }

  photosInput?.addEventListener("change", () => {
    const newlyChosenFiles = Array.from(photosInput.files || []);
    const validFiles = newlyChosenFiles.filter(file => file.type.startsWith("image/"));
    const invalidCount = newlyChosenFiles.length - validFiles.length;

    const remainingSlots = 2 - selectedPhotoFiles.length;
    const filesToAdd = validFiles.slice(0, Math.max(0, remainingSlots));
    selectedPhotoFiles.push(...filesToAdd);

    // Limpa o input para permitir selecionar novamente o mesmo arquivo,
    // sem apagar a lista mantida em selectedPhotoFiles.
    photosInput.value = "";

    if (invalidCount) {
      photoStatus.textContent = "Arquivos que não são imagens foram ignorados.";
    } else if (validFiles.length > remainingSlots) {
      photoStatus.textContent = "Limite de 2 imagens atingido. Remova uma imagem para adicionar outra.";
    }

    renderPhotoPreview();
  });

async function carregarAddons() {

  const { data, error } =
    await supabase
      .from("service_addons")
      .select("*")
      .eq("user_id", ownerId);

  if (error) {

    console.log(error);

    return;
  }

  if (!data || data.length === 0) {
    addonsArea.classList.add("hidden");
    return;
  }

  addonsArea.classList.remove("hidden");

  addonsList.innerHTML = "";

  data.forEach(addon => {

    const label =
      document.createElement("label");

    label.className = "addon-item";

    const checkbox =
      document.createElement("input");

    checkbox.type = "checkbox";

    checkbox.value = addon.id;

    checkbox.dataset.name =
      addon.name;

    checkbox.dataset.price =
      addon.price;

    checkbox.dataset.duration =
      addon.duration;

    checkbox.addEventListener("change", () => {

      calcularDuracaoTotal();

    });

    const span = document.createElement("span");
    span.textContent = `${addon.name} · +R$ ${Number(addon.price).toFixed(2)} · +${Number(addon.duration) || 0} min`;

    label.appendChild(checkbox);
    label.appendChild(span);

    addonsList.appendChild(label);

  });

}

function calcularDuracaoTotal() {

  const selected =
    serviceSelect.options[
      serviceSelect.selectedIndex
    ];

  if (!selected) return;

  let totalDuration =
    parseInt(
      selected.dataset.duration || 0
    );

  let totalPrice =
    parseFloat(
      selected.dataset.price || 0
    );

  const checkboxes =
    document.querySelectorAll(
      '#addonsList input[type="checkbox"]:checked'
    );

  checkboxes.forEach(cb => {

    totalDuration += parseInt(
      cb.dataset.duration || 0
    );

    totalPrice += parseFloat(
      cb.dataset.price || 0
    );

  });

  selectedDuration =
    totalDuration;

  document.getElementById(
    "totalPrice"
  ).innerText =
    `Total: R$ ${totalPrice.toFixed(2)}`;

  document.getElementById(
    "totalDuration"
  ).innerText =
    `⏰ Tempo total: ${totalDuration} min`;

}

ownerId = profile.id;

await carregarAddons();

document.getElementById("studioName").innerText =
  profile.studio_name || "Studio";

if (profile.logo_url)
  document.getElementById("logo").src =
    profile.logo_url;
  
  // 🔵 SERVIÇOS
const serviceSelect =
  document.getElementById("service");

serviceSelect.innerHTML = `
  <option>Carregando...</option>
`;

try {

  const response = await supabase
    .from("services")
    .select("*")
    .eq("user_id", ownerId);

  const services = response.data;

  serviceSelect.innerHTML = "";

  if (!services || services.length === 0) {

    serviceSelect.innerHTML = `
      <option>
        Nenhum serviço disponível
      </option>
    `;

  } else {

    services.forEach(s => {

      const opt =
        document.createElement("option");

      opt.value = s.id;

      opt.textContent =
        `${s.name} - R$ ${Number(s.price).toFixed(2)}`;

      opt.dataset.duration =
        s.duration || 30;

      opt.dataset.name =
        s.name;

      opt.dataset.price =
        s.price;

      opt.dataset.description =
        s.description || "";

      serviceSelect.appendChild(opt);

    });

  }

  if (services.length > 0) {
    calcularDuracaoTotal();
    serviceSelect.dispatchEvent(new Event("change"));
  }

} catch(err) {

  alert("Erro ao carregar serviços");

  console.log(err);

}

serviceSelect.addEventListener("change", () => {
  
  const selected =
    serviceSelect.options[
      serviceSelect.selectedIndex
    ];

  calcularDuracaoTotal();

  // 📋 DESCRIÇÃO
  const descriptionBox =
    document.getElementById(
      "serviceDescription"
    );

  const descriptionText =
    document.getElementById(
      "serviceDescriptionText"
    );

  const description =
    selected.dataset.description;

  if (description && description.trim() !== "") {

    descriptionBox.classList.remove("hidden");

    descriptionText.innerText =
      description;

  } else {

    descriptionBox.classList.add("hidden");

  }

  const date =
    document.getElementById("date").value;

  if (date) {
    render(date).catch(err => {
      console.error(err);
      timesDiv.textContent = err.message || "Erro ao carregar horários.";
    });
  }

  calcularDuracaoTotal();
  
});

const slotInterval = Number(profile.slot_interval) || 30;

// Datas do input são YYYY-MM-DD. Criamos a data em horário local para
// evitar deslocamentos de fuso ao identificar o dia da semana.
function getWeekdayFromDate(date) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).getDay();
}

function normalizeTime(value) {
  return String(value || "").slice(0, 5);
}

function gerarSlots(openTime, closeTime) {
  const result = [];
  let [h, m] = normalizeTime(openTime).split(":").map(Number);
  const [hEnd, mEnd] = normalizeTime(closeTime).split(":").map(Number);
  const interval = Math.max(1, slotInterval);

  if (![h, m, hEnd, mEnd].every(Number.isFinite)) return result;

  let current = h * 60 + m;
  const end = hEnd * 60 + mEnd;

  while (current < end) {
    const hour = Math.floor(current / 60);
    const minute = current % 60;
    result.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    current += interval;
  }
  return result;
}

// Busca somente os dados agregados necessários para calcular ocupação.
// A função no banco nunca retorna nome, telefone, descrição ou fotos de clientes.
async function getBusy(date) {
  const { data, error } = await supabase.rpc("get_public_booking_occupancy", {
    p_username: username,
    p_date: date
  });

  if (error) {
    console.error("Erro ao consultar ocupação dos horários:", error);
    throw new Error("Não foi possível verificar os horários ocupados. Tente novamente.");
  }

  return (data || []).flatMap(row =>
    Array.from({ length: Number(row.appointment_count) || 0 }, () => ({
      time: row.appointment_time,
      duration: Number(row.appointment_duration) || 30
    }))
  );
}

// Renderiza a agenda usando a disponibilidade específica do dia selecionado.
async function render(date) {
  timesDiv.innerHTML = "";

  if (!date) return;

  const weekday = getWeekdayFromDate(date);
  const { data: dayAvailability, error: availabilityError } = await supabase
    .from("availability")
    .select("weekday, open_time, close_time, chairs")
    .eq("user_id", ownerId)
    .eq("weekday", weekday)
    .maybeSingle();

  if (availabilityError) {
    console.error("Erro ao carregar disponibilidade do dia:", availabilityError);
    timesDiv.textContent = "Não foi possível carregar a disponibilidade deste dia.";
    return;
  }

  if (!dayAvailability) {
    timesDiv.textContent = "Este studio não atende neste dia.";
    return;
  }

  const capacity = Math.max(1, Number(dayAvailability.chairs) || 1);
  const appointments = await getBusy(date);
  slots = gerarSlots(dayAvailability.open_time, dayAvailability.close_time);

  if (!slots.length) {
    timesDiv.textContent = "Não há horários disponíveis para este dia.";
    return;
  }

  const now = new Date();
  const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  slots.forEach(t => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerText = t;

    let ocupados = 0;
    const [th, tm] = t.split(":").map(Number);
    const slotMinutes = th * 60 + tm;

    appointments.forEach(app => {
      const duration = Number(app.duration) || 30;
      const [ah, am] = normalizeTime(app.time).split(":").map(Number);
      const start = ah * 60 + am;
      const finish = start + duration;

      if (slotMinutes >= start && slotMinutes < finish) {
        ocupados++;
      }
    });

    const isPast = date === todayString && slotMinutes <= currentMinutes;

    if (ocupados >= capacity || isPast) {
      btn.disabled = true;
      btn.title = isPast ? "Este horário já passou" : "Horário indisponível";
      btn.className = "bg-gray-100 border border-gray-200 p-2 rounded-xl opacity-60 cursor-not-allowed";
    } else {
      btn.className = "bg-white hover:bg-[#696969] border border-[#696969] p-2 rounded-xl transition";
      btn.onclick = () => {
        selectedSlot = t;
        document.querySelectorAll("#times button").forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
      };
    }

    timesDiv.appendChild(btn);
  });
}

  const dateInput = document.getElementById("date");
  const nowForDate = new Date();
  const localToday = `${nowForDate.getFullYear()}-${String(nowForDate.getMonth() + 1).padStart(2, "0")}-${String(nowForDate.getDate()).padStart(2, "0")}`;
  dateInput.min = localToday;

  dateInput.addEventListener("change", (e) => {
    selectedSlot = null;
    render(e.target.value).catch(err => {
      console.error(err);
      timesDiv.textContent = err.message || "Erro ao carregar horários.";
    });
  });

  
  // ================= AGENDAR =================
  window.agendar = async function () {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const description = document.getElementById("description").value.trim();
    const photoFiles = [...selectedPhotoFiles];
    const date = document.getElementById("date").value;
    const serviceSelect = document.getElementById("service");
    const selectedService = serviceSelect.options[serviceSelect.selectedIndex];

    if (!selectedService || !selectedService.dataset.name) {
      alert("Selecione um serviço antes de continuar.");
      return;
    }
    if (!name || !phone || !date || !selectedSlot) {
      alert("Preencha seu nome, WhatsApp, data e escolha um horário.");
      return;
    }
    if (photoFiles.length > 2) {
      alert("Você pode enviar no máximo 2 imagens.");
      return;
    }
    if (photoFiles.some(file => !file.type.startsWith("image/"))) {
      alert("Envie somente arquivos de imagem.");
      return;
    }

    const service = selectedService.dataset.name;
    const addonsSelecionados = [];
    document.querySelectorAll('#addonsList input[type="checkbox"]:checked').forEach(cb => {
      addonsSelecionados.push({
        id: cb.value,
        name: cb.dataset.name,
        price: Number(cb.dataset.price),
        duration: Number(cb.dataset.duration)
      });
    });

    if (confirmBookingButton) {
      confirmBookingButton.disabled = true;
      confirmBookingButton.innerHTML = '<i data-lucide="loader-circle"></i><span>Enviando agendamento...</span>';
      window.lucide?.createIcons();
    }

    let photo_urls = [];
    const uploadedPaths = [];

    try {
      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const uniqueToken = (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
        const filePath = `${ownerId}/${uniqueToken}-${i + 1}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("appointment-photos")
          .upload(filePath, file, { upsert: false });
        if (uploadError) throw uploadError;

        uploadedPaths.push(filePath);
        const { data } = supabase.storage.from("appointment-photos").getPublicUrl(filePath);
        if (data?.publicUrl) photo_urls.push(data.publicUrl);
      }

      const { error } = await supabase.from("appointments").insert([{
        user_id: ownerId,
        name,
        phone,
        service,
        duration: selectedDuration,
        date,
        time: selectedSlot,
        status: "booked",
        description,
        photo_urls,
        addons: addonsSelecionados
      }]);

      if (error) throw error;

      alert("Agendamento realizado com sucesso!");
      document.getElementById("name").value = "";
      document.getElementById("phone").value = "";
      document.getElementById("description").value = "";
      document.getElementById("photos").value = "";
      selectedPhotoFiles = [];
      renderPhotoPreview();
      document.querySelectorAll('#addonsList input[type="checkbox"]').forEach(cb => cb.checked = false);
      selectedSlot = null;
      calcularDuracaoTotal();
      await render(date);

    } catch (err) {
      console.error("Erro ao realizar agendamento:", err);
      alert(err.message || "Não foi possível concluir o agendamento. Confira os dados e tente novamente.");
      if (uploadedPaths.length) {
        const { error: cleanupError } = await supabase.storage.from("appointment-photos").remove(uploadedPaths);
        if (cleanupError) console.warn("Não foi possível limpar imagens temporárias:", cleanupError);
      }
    } finally {
      if (confirmBookingButton) {
        confirmBookingButton.disabled = false;
        confirmBookingButton.innerHTML = '<i data-lucide="calendar-check"></i><span>Confirmar agendamento</span>';
        window.lucide?.createIcons();
      }
    }
  };

});
