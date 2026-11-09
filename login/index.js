document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) window.lucide.createIcons();

    const supabase = window.supabase.createClient(
      "https://bjaurtrqrasznuptthyf.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqYXVydHJxcmFzem51cHR0aHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MDkwNTIsImV4cCI6MjA5MzQ4NTA1Mn0.iCQyvzAJykzgLO4kZkJZ8qNbv3549rG_JuwcVEZDrKA"
    );

    const msg = document.getElementById("msg");

    // ================= LOGIN =================
    document.getElementById("btnLogin").addEventListener("click", async () => {

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      msg.className =
        "text-center text-sm mt-4 text-[#555555] min-h-[20px]";

      msg.innerText = "Entrando...";

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data?.user || !data?.session) {
        msg.className =
          "text-center text-sm mt-4 text-[#b4534b] min-h-[20px]";
        msg.innerText = error?.message || "Login inválido";
        return;
      }

      window.location.href = "perfil.html";
    });

    // ================= SIGNUP =================
    document.getElementById("btnSignup").addEventListener("click", async () => {

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      if (password.length < 6) {
        msg.innerText = "Senha mínima 6 caracteres";
        return;
      }

      msg.className =
        "text-center text-sm mt-4 text-[#555555] min-h-[20px]";

      msg.innerText = "Criando conta...";

      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        msg.className =
          "text-center text-sm mt-4 text-[#b4534b] min-h-[20px]";
        msg.innerText = error.message;
        return;
      }

      // ⚠️ IMPORTANTE: usuário pode não estar confirmado dependendo do Supabase
      if (!data?.user) {
        msg.innerText = "Verifique seu email para confirmar a conta.";
        return;
      }

      msg.className =
        "text-center text-sm mt-4 text-[#657b5a] min-h-[20px]";

      msg.innerText =
        "Conta criada! Verifique seu email ou clique em entrar.";
    });

  });