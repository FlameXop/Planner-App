window.addEventListener("load", () => {
  const welcome = document.getElementById("welcome-screen");
  const app = document.getElementById("app");

  setTimeout(() => {
    if (welcome) welcome.classList.add("fade-out");
    if (app) app.classList.add("visible");
  }, 1000);
});
