import { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import { medicationService } from '../services';
import { Medicine } from '../types';

/**
 * Hook for monitoring medication stock levels
 * Provides alerts for low stock and expiring medicines
 */
export function useStockMonitor() {
  const { userId } = useAuthStore();
  const [lowStockMedicines, setLowStockMedicines] = useState<Medicine[]>([]);
  const [expiringMedicines, setExpiringMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    checkStockLevels();
  }, [userId]);

  const checkStockLevels = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const [lowStock, expiring] = await Promise.all([
        medicationService.getLowStockMedicines(userId),
        medicationService.getExpiringMedicines(userId),
      ]);

      setLowStockMedicines(lowStock);
      setExpiringMedicines(expiring);
    } catch (error) {
      console.error('Failed to check stock levels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasAlerts = lowStockMedicines.length > 0 || expiringMedicines.length > 0;
  const totalAlerts = lowStockMedicines.length + expiringMedicines.length;

  return {
    lowStockMedicines,
    expiringMedicines,
    hasAlerts,
    totalAlerts,
    isLoading,
    checkStockLevels,
  };
}
