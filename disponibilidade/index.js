document.addEventListener("DOMContentLoaded", async () => {

  // 🔗 SUPABASE
  const supabase =
    window.supabase.createClient(
      "https://bjaurtrqrasznuptthyf.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqYXVydHJxcmFzem51cHR0aHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDkwNTIsImV4cCI6MjA5MzQ4NTA1Mn0.iCQyvzAJykzgLO4kZkJZ8qNbv3549rG_JuwcVEZDrKA"
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

  // 📅 DIAS
  const dias = [

    {
      key: "monday",
      label: "Segunda"
    },

    {
      key: "tuesday",
      label: "Terça"
    },

    {
      key: "wednesday",
      label: "Quarta"
    },

    {
      key: "thursday",
      label: "Quinta"
    },

    {
      key: "friday",
      label: "Sexta"
    },

    {
      key: "saturday",
      label: "Sábado"
    },

    {
      key: "sunday",
      label: "Domingo"
    }

  ];

  const lista =
    document.getElementById("lista");

  // 🔍 BUSCAR DISPONIBILIDADE
  const {
    data: existing
  } = await supabase
    .from("availability")
    .select("*")
    .eq("user_id", user.id);

  // 🎨 RENDER
  dias.forEach(dia => {

    const item =
      existing?.find(
        x => x.weekday === dia.key
      );

    const div =
      document.createElement("div");

    div.className =
      "bg-white rounded-3xl shadow-xl p-5";

    div.innerHTML = `

      <div class="flex items-center justify-between mb-4">

        <h2 class="text-xl font-bold text-gray-800">
          ${dia.label}
        </h2>

        <label class="flex items-center gap-2">

          <input
            type="checkbox"
            class="ativo w-5 h-5"
            ${item ? "checked" : ""}
          >

          <span class="text-sm text-gray-600">
            Ativo
          </span>

        </label>

      </div>

      <div class="grid grid-cols-2 gap-3">

        <div>

          <label class="text-sm text-gray-500">
            Abre
          </label>

          <input
            type="time"
            class="open w-full p-3 border rounded-2xl mt-1"
            value="${item?.open_time || "08:00"}"
          >

        </div>

        <div>

          <label class="text-sm text-gray-500">
            Fecha
          </label>

          <input
            type="time"
            class="close w-full p-3 border rounded-2xl mt-1"
            value="${item?.close_time || "18:00"}"
          >

        </div>

      </div>

      <div class="mt-4">

        <label class="text-sm text-gray-500">
          Quantidade de cadeiras
        </label>

        <input
          type="number"
          min="1"
          class="chairs w-full p-3 border rounded-2xl mt-1"
          value="${item?.chairs || 1}"
        >

      </div>

    `;

    div.dataset.weekday =
      dia.key;

    lista.appendChild(div);

  });

  // 💾 SALVAR
  document
    .getElementById("salvarTudo")
    .addEventListener("click", async () => {

      // 🧹 LIMPAR ANTIGOS
      await supabase
        .from("availability")
        .delete()
        .eq("user_id", user.id);

      // 🔁 LOOP
      const cards =
        document.querySelectorAll(
          "#lista > div"
        );

      for (const card of cards) {

        const ativo =
          card.querySelector(".ativo").checked;

        if (!ativo) continue;

        const weekday =
          card.dataset.weekday;

        const open =
          card.querySelector(".open").value;

        const close =
          card.querySelector(".close").value;

        const chairs =
          Number(
            card.querySelector(".chairs").value
          );

        await supabase
          .from("availability")
          .insert([
            {
              user_id: user.id,
              weekday,
              open_time: open,
              close_time: close,
              chairs
            }
          ]);

      }

      alert("Disponibilidade salva!");

    });

});
