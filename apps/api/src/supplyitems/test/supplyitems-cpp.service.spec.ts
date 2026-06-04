import { Test, TestingModule } from '@nestjs/testing';
import { SupplyItemsService } from '../service/supplyitems.service';
import { SupplyItemsRepository } from '../repository/supplyitems.repository';
import { LockService } from '../../lock/service/lock.service';

describe('SupplyItemsService - CPP Calculation', () => {
  let service: SupplyItemsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplyItemsService,
        {
          provide: SupplyItemsRepository,
          useValue: {}, // Not needed for pure logic tests
        },
        {
          provide: LockService,
          useValue: {}, // Not needed for pure logic tests
        },
      ],
    }).compile();

    service = module.get<SupplyItemsService>(SupplyItemsService);
  });

  describe('calculateCpp', () => {
    it('should calculate weighted average correctly (Happy Path)', () => {
      // (10 * 5 + 10 * 7) / 20 = 120 / 20 = 6
      const result = (service as any).calculateCpp({
        stockActual: '10',
        costoPrevio: '5',
        cantidadRecibida: '10',
        costoNuevo: '7',
      });
      expect(result.toString()).toBe('6');
    });

    it('should handle initial stock (stockActual = 0)', () => {
      // (0 * 0 + 10 * 8) / 10 = 8
      const result = (service as any).calculateCpp({
        stockActual: '0',
        costoPrevio: '0',
        cantidadRecibida: '10',
        costoNuevo: '8',
      });
      expect(result.toString()).toBe('8');
    });

    it('should throw Error if cantidadRecibida <= 0', () => {
      expect(() =>
        (service as any).calculateCpp({
          stockActual: '10',
          costoPrevio: '5',
          cantidadRecibida: '0',
          costoNuevo: '7',
        }),
      ).toThrow();

      expect(() =>
        (service as any).calculateCpp({
          stockActual: '10',
          costoPrevio: '5',
          cantidadRecibida: '-1',
          costoNuevo: '7',
        }),
      ).toThrow();
    });

    it('should throw Error if stockActual < 0', () => {
      expect(() =>
        (service as any).calculateCpp({
          stockActual: '-1',
          costoPrevio: '5',
          cantidadRecibida: '10',
          costoNuevo: '7',
        }),
      ).toThrow();
    });

    it('should throw Error if costoPrevio < 0', () => {
      expect(() =>
        (service as any).calculateCpp({
          stockActual: '10',
          costoPrevio: '-1',
          cantidadRecibida: '10',
          costoNuevo: '7',
        }),
      ).toThrow();
    });

    it('should throw Error if costoNuevo < 0', () => {
      expect(() =>
        (service as any).calculateCpp({
          stockActual: '10',
          costoPrevio: '5',
          cantidadRecibida: '10',
          costoNuevo: '-1',
        }),
      ).toThrow();
    });

    it('should use Decimal-safe arithmetic (precision sensitivity)', () => {
      // (0.1 * 0.2 + 0.3 * 0.4) / 0.4
      // (0.02 + 0.12) / 0.4 = 0.14 / 0.4 = 0.35
      // Floating point might fail this or result in 0.35000000000000003
      const result = (service as any).calculateCpp({
        stockActual: '0.1',
        costoPrevio: '0.2',
        cantidadRecibida: '0.3',
        costoNuevo: '0.4',
      });
      expect(result.toString()).toBe('0.35');
    });
  });
});
