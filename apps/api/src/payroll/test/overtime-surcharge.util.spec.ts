import { AttendanceOvertimeType } from '../payroll.constants';
import { classifyOvertimeSurcharge } from '../utils/overtime-surcharge.util';

const RATES = {
  recargoHoraExtraDiurna: 0.25,
  recargoHoraExtraNocturna: 0.75,
  recargoDominicalFestivo: 0.75,
};

describe('classifyOvertimeSurcharge', (): void => {
  it('no festivo, no nocturno -> DIURNO con RECARGO_HORA_EXTRA_DIURNA', (): void => {
    const result = classifyOvertimeSurcharge(false, false, RATES);

    expect(result).toEqual({ type: AttendanceOvertimeType.DIURNO, surchargeRate: 0.25 });
  });

  it('no festivo, nocturno -> NOCTURNO con RECARGO_HORA_EXTRA_NOCTURNA', (): void => {
    const result = classifyOvertimeSurcharge(true, false, RATES);

    expect(result).toEqual({ type: AttendanceOvertimeType.NOCTURNO, surchargeRate: 0.75 });
  });

  it('festivo, no nocturno -> FESTIVO_DIURNO con RECARGO_DOMINICAL_FESTIVO', (): void => {
    const result = classifyOvertimeSurcharge(false, true, RATES);

    expect(result).toEqual({ type: AttendanceOvertimeType.FESTIVO_DIURNO, surchargeRate: 0.75 });
  });

  it('festivo y nocturno -> FESTIVO_NOCTURNO con recargo combinado (Ley 51/1983)', (): void => {
    const result = classifyOvertimeSurcharge(true, true, RATES);

    expect(result).toEqual({ type: AttendanceOvertimeType.FESTIVO_NOCTURNO, surchargeRate: 1.5 });
  });
});
