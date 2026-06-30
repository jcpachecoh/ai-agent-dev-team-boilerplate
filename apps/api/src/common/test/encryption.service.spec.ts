import { EncryptionService } from '../services/encryption.service';

const VALID_KEY = 'a'.repeat(64); // 32 bytes as 64 hex chars

function makeService(key = VALID_KEY): EncryptionService {
  process.env.ENCRYPTION_KEY = key;
  return new EncryptionService();
}

describe('EncryptionService', () => {
  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  describe('constructor', () => {
    it('inicializa correctamente con clave válida', () => {
      expect(() => makeService()).not.toThrow();
    });

    it('lanza error si ENCRYPTION_KEY no está definida', () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => new EncryptionService()).toThrow(
        'ENCRYPTION_KEY environment variable is not set',
      );
    });

    it('lanza error si ENCRYPTION_KEY tiene longitud incorrecta', () => {
      process.env.ENCRYPTION_KEY = 'abc';
      expect(() => new EncryptionService()).toThrow('ENCRYPTION_KEY must be');
    });
  });

  describe('encrypt / decrypt', () => {
    it('cifra y descifra correctamente un valor', () => {
      // Arrange
      const service = makeService();
      const plaintext = '1234567890';

      // Act
      const ciphertext = service.encrypt(plaintext);
      const decrypted = service.decrypt(ciphertext);

      // Assert
      expect(decrypted).toBe(plaintext);
    });

    it('produce ciphertexts distintos para el mismo plaintext (IV aleatorio)', () => {
      // Arrange
      const service = makeService();
      const plaintext = '1234567890';

      // Act
      const c1 = service.encrypt(plaintext);
      const c2 = service.encrypt(plaintext);

      // Assert
      expect(c1).not.toBe(c2);
    });

    it('el ciphertext tiene formato iv:authTag:data (3 partes separadas por :)', () => {
      // Arrange
      const service = makeService();

      // Act
      const ciphertext = service.encrypt('test');

      // Assert
      expect(ciphertext.split(':').length).toBe(3);
    });

    it('nunca almacena el plaintext en el ciphertext', () => {
      // Arrange
      const service = makeService();
      const plaintext = '9876543210';

      // Act
      const ciphertext = service.encrypt(plaintext);

      // Assert
      expect(ciphertext).not.toContain(plaintext);
    });

    it('lanza error si el formato del ciphertext es inválido', () => {
      // Arrange
      const service = makeService();

      // Act & Assert
      expect(() => service.decrypt('invalid-format')).toThrow('Invalid ciphertext format');
    });

    it('cifra y descifra correctamente strings con caracteres especiales', () => {
      // Arrange
      const service = makeService();
      const plaintext = 'NIT: 900.123.456-7 / Régimen común';

      // Act
      const decrypted = service.decrypt(service.encrypt(plaintext));

      // Assert
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('mask', () => {
    it('muestra solo los últimos 4 dígitos', () => {
      // Arrange
      const service = makeService();

      // Act & Assert
      expect(service.mask('1234567890')).toBe('******7890');
    });

    it('devuelve el valor completo si es más corto que keepLast', () => {
      // Arrange
      const service = makeService();

      // Act & Assert
      expect(service.mask('123', 4)).toBe('123');
    });

    it('soporta keepLast personalizado', () => {
      // Arrange
      const service = makeService();

      // Act & Assert
      expect(service.mask('1234567890', 6)).toBe('****567890');
    });
  });

  describe('last', () => {
    it('extrae los últimos 4 caracteres por defecto', () => {
      // Arrange
      const service = makeService();

      // Act & Assert
      expect(service.last('1234567890')).toBe('7890');
    });

    it('soporta n personalizado', () => {
      // Arrange
      const service = makeService();

      // Act & Assert
      expect(service.last('123456', 2)).toBe('56');
    });
  });
});
