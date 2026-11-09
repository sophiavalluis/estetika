document.addEventListener("DOMContentLoaded", async () => {

  const supabase = window.supabase.createClient(
    "https://nxbqhwubyeayzgnncxsk.supabase.co",
    "sb_publishable_xq8o46ej843IL_PeYNeqtw_ShRZIIiQJykzgLO4kZkJZ8qNbv3549rG_JuwcVEZDrKA"
  );

  //ESSA LINHA É BISU FI
  await supabase.auth.getSession();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "/login/";
    return;
  }

  // garante sessão carregada antes de entrar no app
  window.location.href = "/perfil/";
});
