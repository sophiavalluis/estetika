document.addEventListener("DOMContentLoaded", async () => {

  const supabase = window.supabase.createClient(
    "https://nxbqhwubyeayzgnncxsk.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54YnFod3VieWVheXpnbm5jeHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NDcyODIsImV4cCI6MjEwNzUyMzI4Mn0.pjHTY7d3Nxwo-bX4JOAjy6plkbhVkb3MhXZTA-Fq4qM"
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
