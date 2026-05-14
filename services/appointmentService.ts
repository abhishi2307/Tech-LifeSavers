import { Appointment } from '../types';
import { appointmentRepository } from '../database/appointmentRepository';

class AppointmentService {
  async addAppointment(appt: Appointment): Promise<Appointment> {
    await appointmentRepository.insert(appt);
    return appt;
  }

  async updateAppointment(appt: Appointment): Promise<Appointment> {
    await appointmentRepository.update(appt);
    return appt;
  }

  async cancelAppointment(id: string): Promise<void> {
    const appt = await appointmentRepository.getById(id);
    if (!appt) return;
    await appointmentRepository.update({
      ...appt,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });
  }

  async completeAppointment(id: string): Promise<void> {
    const appt = await appointmentRepository.getById(id);
    if (!appt) return;
    await appointmentRepository.update({
      ...appt,
      status: 'completed',
      updatedAt: new Date().toISOString(),
    });
  }

  async getUpcomingAppointments(userId: string): Promise<Appointment[]> {
    return appointmentRepository.getUpcoming(userId);
  }

  async getPastAppointments(userId: string): Promise<Appointment[]> {
    return appointmentRepository.getPast(userId);
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    return appointmentRepository.getById(id);
  }
}

export const appointmentService = new AppointmentService();
