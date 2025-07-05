// Constantes
const RESINA_MAX = 200;
const RESINA_INTERVALO_MS = 8 * 60 * 1000; // 8 minutos en ms
const UPDATE_INTERVAL_MS = 60 * 1000; // Actualizar cada minuto
const ALERTA_THRESHOLD = 20; // Resina restante para activar la alerta

// Elementos del DOM cacheados
const resinaInput = document.getElementById("resinaActual");
const guardarBtn = document.getElementById("guardarBtn");
const resetBtn = document.getElementById("resetBtn");
const estadoResina = document.getElementById("estadoResina");
const filtroDiaSelect = document.getElementById("filtroDia");
const buscarPersonajeInput = document.getElementById("buscarPersonaje");
const personajesContainer = document.getElementById("personajesContainer");
const feedbackMessage = document.querySelector(".feedback-message"); // Para resina
const themeToggle = document.getElementById("themeToggle");
const resinaAlerta = document.getElementById("resinaAlerta");
const activarAlertaCheckbox = document.getElementById("activarAlerta");

// Elementos del formulario de añadir personaje
const addCharacterForm = document.getElementById("addCharacterForm");
const charNameInput = document.getElementById("charName");
const charMaterialInput = document.getElementById("charMaterial");
const dayCheckboxes = document.querySelectorAll('.days-checkbox-group input[type="checkbox"]');
const charImageInput = document.getElementById("charImage");
const addCharFeedback = document.getElementById("addCharFeedback");

// SVGs del botón de tema
const iconMoon = themeToggle.querySelector('.icon-moon');
const iconSun = themeToggle.querySelector('.icon-sun');

let updateIntervalId; // Para almacenar el ID del intervalo y poder limpiarlo
let characters = []; // Array para almacenar los personajes del usuario

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
 * @param {HTMLElement} targetElement - El elemento donde mostrar el feedback (ej. feedbackMessage o addCharFeedback).
 */
function showFeedback(message, isError = false, targetElement = feedbackMessage) {
  targetElement.textContent = message;
  targetElement.style.color = isError ? "var(--color-delete-btn)" : "var(--color-button-primary)"; // Usar variables CSS
  targetElement.classList.add("show");
  setTimeout(() => {
    targetElement.classList.remove("show");
  }, 3000);
}

/**
 * Calcula y muestra el estado actual de la resina.
 */
function calcularResina() {
  const valorGuardado = parseInt(localStorage.getItem("resinaValor"), 10);
  const tiempoGuardado = parseInt(localStorage.getItem("resinaTiempo"), 10);

  if (isNaN(valorGuardado) || isNaN(tiempoGuardado)) {
    estadoResina.innerHTML = "Aún no se ha registrado una cantidad.";
    resinaAlerta.style.display = 'none';
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

  // Manejo de la alerta
  if (activarAlertaCheckbox.checked && resinaActual >= (RESINA_MAX - ALERTA_THRESHOLD) && resinaActual < RESINA_MAX) {
      resinaAlerta.style.display = 'block';
  } else {
      resinaAlerta.style.display = 'none';
  }

  if (resinaActual >= RESINA_MAX) {
    tiempoRestante = 0;
    resinaActual = RESINA_MAX;
    if (updateIntervalId) {
      clearInterval(updateIntervalId);
      updateIntervalId = null;
    }
    estadoResina.innerHTML = `Tienes <strong>${resinaActual}</strong> de resina.<br>
      ¡Tu resina está completamente llena!`;
  } else {
    if (!updateIntervalId) {
        updateIntervalId = setInterval(calcularResina, UPDATE_INTERVAL_MS);
    }
    const fechaLlenado = new Date(ahora + tiempoRestante);
    const horasRestantes = Math.floor(tiempoRestante / (60 * 60 * 1000));
    const minutosRestantes = Math.floor((tiempoRestante % (60 * 60 * 1000)) / (60 * 1000));
    const fechaLlenadoFormateada = new Intl.DateTimeFormat('es-ES', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(fechaLlenado);
    estadoResina.innerHTML = `Tienes <strong>${resinaActual}</strong> de resina.<br>
      Se llenará completamente en: <strong>${horasRestantes}h ${minutosRestantes}m</strong><br>
      Hora estimada: <strong>${fechaLlenadoFormateada}</strong>`;
  }
  // Actualizar el input de resina con el valor calculado
  resinaInput.value = resinaActual;
  guardarResina(resinaActual); // Guarda el valor actualizado automáticamente
}

/**
 * Renderiza todos los personajes en el contenedor.
 */
function renderPersonajes() {
    personajesContainer.innerHTML = ''; // Limpiar contenedor
    characters.forEach((char, index) => {
        const tarjeta = document.createElement('div');
        tarjeta.classList.add('tarjeta');
        tarjeta.dataset.dias = char.dias.join(',');
        tarjeta.dataset.nombre = char.name;
        tarjeta.dataset.index = index; // Guardar el índice para facilitar la eliminación

        const defaultImage = "https://via.placeholder.com/150x150?text=No+Image"; // Imagen por defecto
        const imageUrl = char.image || defaultImage;

        tarjeta.innerHTML = `
            <img src="${imageUrl}" alt="Imagen de ${char.name}" onerror="this.onerror=null;this.src='${defaultImage}';">
            <h3>${char.name}</h3>
            <p><strong>Material:</strong> ${char.material}</p>
            <p><strong>Días:</strong> ${char.dias.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}</p>
            <button class="delete-btn" data-index="${index}" aria-label="Eliminar personaje">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        `;
        personajesContainer.appendChild(tarjeta);
    });
    filtrarPersonajes(); // Aplicar el filtro después de renderizar
}


/**
 * Filtra las tarjetas de personajes según el día seleccionado y la búsqueda.
 */
function filtrarPersonajes() {
  const diaSeleccionado = filtroDiaSelect.value;
  const textoBusqueda = buscarPersonajeInput.value.toLowerCase();

  document.querySelectorAll(".tarjeta").forEach(tarjeta => {
    const diasDisponibles = tarjeta.dataset.dias.split(',').map(d => d.trim());
    const nombrePersonaje = tarjeta.dataset.nombre.toLowerCase();

    const coincideDia = (diaSeleccionado === "todos" || diasDisponibles.includes(diaSeleccionado));
    const coincideBusqueda = nombrePersonaje.includes(textoBusqueda);

    if (coincideDia && coincideBusqueda) {
      tarjeta.classList.add("visible");
      tarjeta.setAttribute("aria-hidden", "false");
    } else {
      tarjeta.classList.remove("visible");
      tarjeta.setAttribute("aria-hidden", "true");
    }
  });
}

/**
 * Alterna entre modo claro y oscuro.
 */
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

    // Alternar visibilidad de los íconos SVG
    if (isDarkMode) {
        iconMoon.style.display = 'none';
        iconSun.style.display = 'block';
    } else {
        iconMoon.style.display = 'block';
        iconSun.style.display = 'none';
    }

    // Ajustar SVG de la flecha del select para dark mode
    const svgFillColor = isDarkMode ? '%23ecf0f1' : '%232e2b29';
    filtroDiaSelect.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg fill="${svgFillColor}" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>')`;
}

/**
 * Carga los personajes guardados de localStorage.
 */
function loadCharacters() {
    const storedCharacters = localStorage.getItem('characters');
    if (storedCharacters) {
        characters = JSON.parse(storedCharacters);
    }
    renderPersonajes();
}

/**
 * Guarda los personajes en localStorage.
 */
function saveCharacters() {
    localStorage.setItem('characters', JSON.stringify(characters));
}

// Event Listeners
guardarBtn.addEventListener("click", () => {
  const valor = parseInt(resinaInput.value, 10);
  if (!isNaN(valor) && valor >= 0 && valor <= RESINA_MAX) {
    guardarResina(valor);
    calcularResina();
    showFeedback("Resina guardada correctamente.");
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
  resinaAlerta.style.display = 'none';
  if (updateIntervalId) {
    clearInterval(updateIntervalId);
    updateIntervalId = null;
  }
});

filtroDiaSelect.addEventListener("change", filtrarPersonajes);
buscarPersonajeInput.addEventListener("input", filtrarPersonajes);

themeToggle.addEventListener("click", toggleTheme);

activarAlertaCheckbox.addEventListener('change', () => {
    localStorage.setItem('alertaActivada', activarAlertaCheckbox.checked);
    calcularResina();
});

// Listener para el formulario de añadir personaje
addCharacterForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Evitar recarga de la página

    const name = charNameInput.value.trim();
    const material = charMaterialInput.value.trim();
    const selectedDays = Array.from(dayCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    const image = charImageInput.value.trim();

    if (!name || !material || selectedDays.length === 0) {
        showFeedback("Por favor, rellena todos los campos obligatorios (nombre, material, días).", true, addCharFeedback);
        return;
    }

    const newCharacter = { name, material, dias: selectedDays, image };
    characters.push(newCharacter);
    saveCharacters();
    renderPersonajes(); // Volver a renderizar para incluir el nuevo personaje
    showFeedback("Personaje añadido correctamente.", false, addCharFeedback);
    addCharacterForm.reset(); // Limpiar el formulario
});

// Delegación de eventos para botones de eliminar (ya que se añaden dinámicamente)
personajesContainer.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
        const indexToDelete = parseInt(deleteBtn.dataset.index, 10);
        if (!isNaN(indexToDelete)) {
            characters.splice(indexToDelete, 1); // Eliminar del array
            saveCharacters(); // Guardar cambios
            renderPersonajes(); // Volver a renderizar
            showFeedback("Personaje eliminado.", false, feedbackMessage); // Usar el feedback general
        }
    }
});


// Inicialización al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  // Cargar tema guardado
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      iconMoon.style.display = 'none';
      iconSun.style.display = 'block';
  } else {
      iconMoon.style.display = 'block';
      iconSun.style.display = 'none';
  }
  // Asegurarse de que el SVG del select tenga el color correcto al cargar el tema
  const isDarkMode = document.body.classList.contains('dark-mode');
  const svgFillColor = isDarkMode ? '%23ecf0f1' : '%232e2b29';
  filtroDiaSelect.style.backgroundImage = `url('data:image/svg+xml;utf8,<svg fill="${svgFillColor}" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>')`;


  // Cargar estado de la alerta
  const alertaActivadaGuardada = localStorage.getItem('alertaActivada');
  if (alertaActivadaGuardada === 'true') {
      activarAlertaCheckbox.checked = true;
  } else {
      activarAlertaCheckbox.checked = false;
  }

  calcularResina(); // Inicia el cálculo y el intervalo si hay datos

  // Auto-seleccionar el día actual
  const diasSemana = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const hoy = new Date().getDay();
  const diaActual = diasSemana[hoy];
  filtroDiaSelect.value = diaActual;

  loadCharacters(); // Cargar y renderizar los personajes guardados al inicio
  // filtrarPersonajes() es llamado dentro de renderPersonajes()
});
