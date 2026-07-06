const URL_SCRIPT =
  "https://script.google.com/macros/s/AKfycbwwmDn5OSywnl8n84Gxz1Hz-G6mqnJbRKlX9x-LBHV-3aHGGijTvnHNX6ZgHVY8zjJDmA/exec";

async function agendarConsulta() {
  const boton = document.getElementById("btnAgendar");

  boton.disabled = true;
  boton.textContent = "Enviando...";

  try {
    const metodoSeleccionado = document.querySelector(
      'input[name="metodoPago"]:checked',
    );

    const datos = {
      nombre: document.getElementById("nombre").value.trim(),
      mascota: document.getElementById("mascota").value.trim(),
      telefono: document.getElementById("telefono").value.trim(),
      correo: document.getElementById("correo").value.trim(),
      fecha: document.getElementById("fecha").value.trim(),
      hora: document.getElementById("hora").value.trim(),
      motivo: document.getElementById("motivo").value.trim(),
      metodoPago: metodoSeleccionado ? metodoSeleccionado.value : "",
    };

    if (Object.values(datos).some((valor) => valor === "")) {
      alert("Por favor complete todos los campos.");
      return;
    }

    const respuesta = await fetch(URL_SCRIPT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    if (!respuesta.ok) {
      throw new Error("No se pudo guardar la reserva.");
    }

    const resultado = await respuesta.json();

    if (resultado.resultado === "ocupada") {
      alert("Lo sentimos, esa fecha y hora ya fue reservada por otro usuario.");
      return;
    }

    // ==================================================
    // AQUÍ MÁS ADELANTE IREMOS A MERCADO PAGO / WEBPAY
    // ==================================================

    procesarPago(datos);
  } catch (error) {
    console.error(error);

    alert("Ocurrió un error al guardar la reserva.");
  } finally {
    boton.disabled = false;
    boton.textContent = "Continuar al pago";
  }
}
const fechaInput = document.getElementById("fecha");

const hoy = new Date().toISOString().split("T")[0];

fechaInput.min = hoy;

const selectorHora = document.getElementById("hora");
let reservas = [];

async function obtenerReservas() {
  try {
    const respuesta = await fetch(URL_SCRIPT, {
      cache: "no-store",
    });
    if (!respuesta.ok) {
      throw new Error("No se pudo conectar con el servidor.");
    }

    reservas = await respuesta.json();
  } catch (error) {
    console.error(error);

    alert(error.message);
  }
}

function cargarHorarios(fechaSeleccionada) {
  selectorHora.innerHTML = '<option value="">Selecciona una hora</option>';

  let horasDisponibles = 0;

  const horarios = ["16:00", "17:00", "18:00", "19:00", "20:00"];

  horarios.forEach((hora) => {
    // Si la fecha seleccionada es hoy, ocultar horas que ya pasaron
    const ahora = new Date();
    const hoy = ahora.toISOString().split("T")[0];

    if (fechaSeleccionada === hoy) {
      const [horaActual, minutoActual] = [ahora.getHours(), ahora.getMinutes()];

      const [horaReserva, minutoReserva] = hora.split(":").map(Number);

      if (
        horaReserva < horaActual ||
        (horaReserva === horaActual && minutoReserva <= minutoActual)
      ) {
        return;
      }
    }

    const ocupada = reservas.some((reserva) => {
      return reserva.fecha === fechaSeleccionada && reserva.hora === hora;
    });

    if (!ocupada) {
      horasDisponibles++;

      const opcion = document.createElement("option");
      opcion.value = hora;
      opcion.textContent = hora;

      selectorHora.appendChild(opcion);
    }
  });

  if (horasDisponibles === 0) {
    selectorHora.innerHTML =
      '<option value="">No hay horas disponibles</option>';
  }
}

fechaInput.addEventListener("change", async () => {
  await obtenerReservas();

  cargarHorarios(fechaInput.value);
});

function procesarPago(datos) {
  switch (datos.metodoPago) {
    case "mercadopago":
      abrirWhatsApp(datos);
      break;

    case "webpay":
      abrirWhatsApp(datos);

      break;

    default:
      alert("Debe seleccionar un método de pago.");
  }
}
function abrirWhatsApp(datos) {
  const mensaje = `Hola, quiero agendar una teleconsulta.

Nombre: ${datos.nombre}
Mascota: ${datos.mascota}
Teléfono: ${datos.telefono}
Correo: ${datos.correo}
Fecha: ${datos.fecha}
Hora: ${datos.hora}
Motivo: ${datos.motivo}`;

  window.open(
    `https://wa.me/56954662320?text=${encodeURIComponent(mensaje)}`,
    "_blank",
  );
}
