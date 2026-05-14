import { Appointment } from '../types';
import { sqliteService } from './sqliteService';

class AppointmentRepository {
  private mapRow(row: any): Appointment {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      doctorName: row.doctor_name ?? undefined,
      clinicName: row.clinic_name ?? undefined,
      appointmentDate: row.appointment_date,
      appointmentTime: row.appointment_time,
      type: row.type,
      notes: row.notes ?? undefined,
      reminderMinutes: row.reminder_minutes ?? 60,
      notificationId: row.notification_id ?? undefined,
      status: row.status,
      location: row.location ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      syncedAt: row.synced_at ?? undefined,
      localOnly: row.local_only === 1,
    };
  }

  async insert(appt: Appointment): Promise<void> {
    await sqliteService.insert('appointments', {
      id: appt.id,
      user_id: appt.userId,
      title: appt.title,
      doctor_name: appt.doctorName ?? null,
      clinic_name: appt.clinicName ?? null,
      appointment_date: appt.appointmentDate,
      appointment_time: appt.appointmentTime,
      type: appt.type,
      notes: appt.notes ?? null,
      reminder_minutes: appt.reminderMinutes,
      notification_id: appt.notificationId ?? null,
      status: appt.status,
      location: appt.location ?? null,
      created_at: appt.createdAt,
      updated_at: appt.updatedAt,
      synced_at: appt.syncedAt ?? null,
      local_only: appt.localOnly ? 1 : 0,
    });
  }

  async update(appt: Appointment): Promise<void> {
    await sqliteService.update(
      'appointments',
      {
        title: appt.title,
        doctor_name: appt.doctorName ?? null,
        clinic_name: appt.clinicName ?? null,
        appointment_date: appt.appointmentDate,
        appointment_time: appt.appointmentTime,
        type: appt.type,
        notes: appt.notes ?? null,
        reminder_minutes: appt.reminderMinutes,
        notification_id: appt.notificationId ?? null,
        status: appt.status,
        location: appt.location ?? null,
        updated_at: appt.updatedAt,
      },
      'id = ?',
      [appt.id]
    );
  }

  async delete(id: string): Promise<void> {
    await sqliteService.delete('appointments', 'id = ?', [id]);
  }

  async getById(id: string): Promise<Appointment | null> {
    const rows = await sqliteService.query('appointments', 'id = ?', [id]);
    return rows.length > 0 ? this.mapRow(rows[0]) : null;
  }

  async getUpcoming(userId: string): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    const rows = await sqliteService.queryRaw(
      `SELECT * FROM appointments WHERE user_id = ? AND appointment_date >= ? AND status = 'scheduled' ORDER BY appointment_date ASC, appointment_time ASC`,
      [userId, today]
    );
    return rows.map((r) => this.mapRow(r));
  }

  async getPast(userId: string): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    const rows = await sqliteService.queryRaw(
      `SELECT * FROM appointments WHERE user_id = ? AND (appointment_date < ? OR status != 'scheduled') ORDER BY appointment_date DESC`,
      [userId, today]
    );
    return rows.map((r) => this.mapRow(r));
  }
}

export const appointmentRepository = new AppointmentRepository();
