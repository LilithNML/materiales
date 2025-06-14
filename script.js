// Constantes
const RESINA_MAX = 200;
const RESINA_INTERVALO_MS = 8 * 60 * 1000; // 8 minutos en ms
const UPDATE_INTERVAL_MS = 60 * 1000; // Actualizar cada minuto

// Elementos del DOM cacheados
const resinaInput = document.getElementById("resinaActual");
const guardarBtn = document.getElementById("guardarBtn");
const resetBtn = document.getElementById("resetBtn");
const estadoResina = document.getElementById("estadoResina");
const filtroDiaSelect = document.getElementById("filtroDia");
const tarjetasPersonaje = document.querySelectorAll(".tarjeta");
const feedbackMessage = document.querySelector(".feedback-message");

let updateIntervalId; // Para almacenar el ID del intervalo y poder limpiarlo

/**
 * Guarda el valor de la resina y el timestamp en localStorage.
 * @param {number} valor - La cantidad de resina a guardar.
 */
function guardarResina(valor) {
  const timestamp = Date.now();
  localStorage.setItem("resinaValor", valor);
  localStorage.setItem("resinaTiempo", timestamp);
}

/**
 * Muestra un mensaje de feedback temporal al usuario.
 * @param {string} message - El mensaje a mostrar.
 * @param {boolean} isError - Si el mensaje es un error (para estilo futuro).
 */
function showFeedback(message, isError = false) {
  feedbackMessage.textContent = message;
  feedbackMessage.classList.add("show");
  if (isError) {
    feedbackMessage.style.color = "red";
  } else {
    feedbackMessage.style.color = "green";
  }
  setTimeout(() => {
    feedbackMessage.classList.remove("show");
  }, 3000); // El mensaje desaparece después de 3 segundos
}

/**
 * Calcula y muestra el estado actual de la resina.
 */
function calcularResina() {
  const valorGuardado = parseInt(localStorage.getItem("resinaValor"), 10);
  const tiempoGuardado = parseInt(localStorage.getItem("resinaTiempo"), 10);

  if (isNaN(valorGuardado) || isNaN(tiempoGuardado)) {
    estadoResina.innerHTML = "Aún no se ha registrado una cantidad.";
    // Limpia el intervalo si no hay datos guardados para evitar cálculos innecesarios
    if (updateIntervalId) {
      clearInterval(updateIntervalId);
      updateIntervalId = null;
    }
    return;
  }

  const ahora = Date.now();
  const tiempoTranscurrido = ahora - tiempoGuardado;
  const resinaRecuperada = Math.floor(tiempoTranscurrido / RESINA_INTERVALO_MS);
  let resinaActual = Math.min(valorGuardado + resinaRecuperada, RESINA_MAX);

  const restante = RESINA_MAX - resinaActual;
  let tiempoRestante = restante * RESINA_INTERVALO_MS;

  // Si la resina ya está llena, el tiempo restante es 0
  if (resinaActual >= RESINA_MAX) {
    tiempoRestante = 0;
    resinaActual = RESINA_MAX; // Asegura que no exceda el máximo
    if (updateIntervalId) { // Detiene las actualizaciones si ya está lleno
      clearInterval(updateIntervalId);
      updateIntervalId = null;
    }
  } else {
    // Si la resina no está llena y el intervalo no está corriendo, inícialo
    if (!updateIntervalId) {
        updateIntervalId = setInterval(calcularResina, UPDATE_INTERVAL_MS);
    }
  }

  const fechaLlenado = new Date(ahora + tiempoRestante);

  // Formato para horas y minutos
  const horasRestantes = Math.floor(tiempoRestante / (60 * 60 * 1000));
  const minutosRestantes = Math.floor((tiempoRestante % (60 * 60 * 1000)) / (60 * 1000));

  // Formato de fecha y hora localizado
  const fechaLlenadoFormateada = new Intl.DateTimeFormat('es-ES', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true, // O false para formato de 24 horas
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(fechaLlenado);

  estadoResina.innerHTML = `Tienes <strong>${resinaActual}</strong> de resina.<br>
    Se llenará completamente en: <strong>${horasRestantes}h ${minutosRestantes}m</strong><br>
    Hora estimada: <strong>${fechaLlenadoFormateada}</strong>`;
}

/**
 * Filtra las tarjetas de personajes según el día seleccionado.
 * @param {string} dia - El día de la semana para filtrar.
 */
function filtrarPersonajes(dia) {
  tarjetasPersonaje.forEach(tarjeta => {
    const diasDisponibles = tarjeta.dataset.dias.split(',').map(d => d.trim()); // Limpiar espacios
    if (diasDisponibles.includes(dia)) {
      tarjeta.classList.add("visible");
      tarjeta.setAttribute("aria-hidden", "false"); // Para lectores de pantalla
    } else {
      tarjeta.classList.remove("visible");
      tarjeta.setAttribute("aria-hidden", "true"); // Para lectores de pantalla
    }
  });
}

// Event Listeners
guardarBtn.addEventListener("click", () => {
  const valor = parseInt(resinaInput.value, 10);
  if (!isNaN(valor) && valor >= 0 && valor <= RESINA_MAX) {
    guardarResina(valor);
    calcularResina();
    showFeedback("Resina guardada correctamente.");
    resinaInput.value = ""; // Limpiar input después de guardar
  } else {
    showFeedback("Introduce un número válido entre 0 y 200.", true);
  }
});

resetBtn.addEventListener("click", () => {
  localStorage.removeItem("resinaValor");
  localStorage.removeItem("resinaTiempo");
  estadoResina.innerHTML = "Aún no se ha registrado una cantidad.";
  resinaInput.value = "";
  showFeedback("Resina restablecida.", false);
  if (updateIntervalId) { // Limpia el intervalo si existe
    clearInterval(updateIntervalId);
    updateIntervalId = null;
  }
});

filtroDiaSelect.addEventListener("change", (e) => {
  filtrarPersonajes(e.target.value);
});

// Inicialización al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  calcularResina();

  // Auto-seleccionar el día actual y filtrar personajes
  const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const hoy = new Date().getDay();
  const diaActual = diasSemana[hoy];
  filtroDiaSelect.value = diaActual;
  filtrarPersonajes(diaActual);

  // Iniciar el intervalo de actualización si la resina no está llena
  // Esto ahora lo maneja calcularResina()
});
