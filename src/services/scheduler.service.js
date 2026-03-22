const cron = require('node-cron');
const pool = require('../db/connection');
const { sendWhatsAppMessage, delay } = require('./whatsapp.service');

// In-memory trackers
const medicationLastSent = new Map(); // key: id_medicamento, value: timestamp
const sentAppointmentReminders = new Set(); // "id_cita_24h" or "id_cita_1h"

function formatHour(dateObj) {
  return dateObj.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(dateObj) {
  return dateObj.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

async function checkMedicationReminders() {
  try {
    const [users] = await pool.query(
      `SELECT id_usuario, telefono_celular
       FROM usuarios
       WHERE whatsapp_enabled = TRUE
         AND telefono_celular IS NOT NULL`
    );

    console.log(`[Scheduler] Usuarios con WhatsApp activo: ${users.length}`);
    for (const user of users) {
      const [medications] = await pool.query(
        `SELECT m.id_medicamento, m.nombre, m.descripcion, f.intervalo_horas
         FROM medicamentos m
         JOIN frecuencias f ON m.id_frecuencia = f.id_frecuencia
         WHERE m.id_usuario = ?
           AND m.estado = 'activo'
           AND m.id_frecuencia IS NOT NULL`,
        [user.id_usuario]
      );

      console.log(`[Scheduler] Usuario ${user.id_usuario} tiene ${medications.length} medicamentos activos`);
      for (const med of medications) {
        const now = Date.now();
        const lastSent = medicationLastSent.get(med.id_medicamento) || 0;
        const intervalMs = med.intervalo_horas * 3600 * 1000;

        if (now - lastSent >= intervalMs) {
          const desc = med.descripcion ? ` - ${med.descripcion}` : '';
          const message = `SANTE Recordatorio: Es hora de tomar tu medicamento: ${med.nombre}${desc}.`;

          const sent = await sendWhatsAppMessage(
            user.telefono_celular,
            message
          );

          if (sent) {
            medicationLastSent.set(med.id_medicamento, now);
          }

          await delay(1500);
        }
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error en recordatorios de medicamentos:', error.message);
  }
}

async function checkAppointmentReminders() {
  try {
    // Appointments ~24h from now (window: 23h55m to 24h05m)
    // Appointments ~1h from now (window: 55m to 65m)
    const [appointments] = await pool.query(
      `SELECT c.id_cita, c.nombre_medico, c.lugar, c.fecha_hora, c.tipo,
              u.telefono_celular,
              TIMESTAMPDIFF(MINUTE, CONVERT_TZ(NOW(), '+00:00', '-05:00'), c.fecha_hora) AS minutes_until
       FROM citas c
       JOIN usuarios u ON c.id_usuario = u.id_usuario
       WHERE u.whatsapp_enabled = TRUE
         AND u.telefono_celular IS NOT NULL
         AND c.estado = 'activo'
         AND (
           TIMESTAMPDIFF(MINUTE, CONVERT_TZ(NOW(), '+00:00', '-05:00'), c.fecha_hora) BETWEEN 1435 AND 1445
           OR
           TIMESTAMPDIFF(MINUTE, CONVERT_TZ(NOW(), '+00:00', '-05:00'), c.fecha_hora) BETWEEN 55 AND 65
         )`
    );

    console.log(`[Scheduler] Citas encontradas: ${appointments.length}`);
    for (const appt of appointments) {
      console.log(`[Scheduler] Cita #${appt.id_cita} - ${appt.nombre_medico} - minutos: ${appt.minutes_until} - tel: ${appt.telefono_celular}`);
      const is24h = appt.minutes_until >= 1435;
      const reminderKey = `${appt.id_cita}_${is24h ? '24h' : '1h'}`;

      if (sentAppointmentReminders.has(reminderKey)) continue;

      const fechaHora = new Date(appt.fecha_hora);
      const hora = formatHour(fechaHora);
      const fecha = formatDate(fechaHora);
      const lugar = appt.lugar || 'No especificado';
      const tipo = appt.tipo ? ` Tipo: ${appt.tipo}.` : '';

      let message;
      if (is24h) {
        message = `SANTE Recordatorio: Tienes una cita manana (${fecha}) con ${appt.nombre_medico} a las ${hora}. Lugar: ${lugar}.${tipo}`;
      } else {
        message = `SANTE URGENTE: Tu cita con ${appt.nombre_medico} es en 1 hora (${hora}). Lugar: ${lugar}.${tipo}`;
      }

      const sent = await sendWhatsAppMessage(
        appt.telefono_celular,
        message
      );

      if (sent) {
        sentAppointmentReminders.add(reminderKey);
      }

      await delay(1500);
    }

    // Clean old entries (older than 25h) every cycle
    // Simple approach: clear the set every 25 hours
    if (sentAppointmentReminders.size > 1000) {
      sentAppointmentReminders.clear();
    }
  } catch (error) {
    console.error('[Scheduler] Error en recordatorios de citas:', error.message);
  }
}

function initScheduler() {
  // Medication reminders: every 30 minutes
  cron.schedule('*/30 * * * *', () => {
    console.log('[Scheduler] Verificando recordatorios de medicamentos...');
    checkMedicationReminders();
  });

  // Appointment reminders: every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    console.log('[Scheduler] Verificando recordatorios de citas...');
    checkAppointmentReminders();
  });

  console.log('[Scheduler] Recordatorios de WhatsApp inicializados');
}

module.exports = { initScheduler };
