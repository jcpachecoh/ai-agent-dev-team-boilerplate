import { GraphQLScalarType, Kind, ValueNode } from 'graphql';
import { builder } from '../builder';

// ─── DateTime scalar ─────────────────────────────────────────────────────────

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO-8601 date-time string (e.g. "2024-01-15T10:30:00.000Z")',
  serialize(value: unknown): string {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') return new Date(value).toISOString();
    if (typeof value === 'number') return new Date(value).toISOString();
    throw new Error(`DateTime cannot represent non-Date value: ${String(value)}`);
  },
  parseValue(value: unknown): Date {
    if (typeof value === 'string' || typeof value === 'number') {
      const d = new Date(value);
      if (isNaN(d.getTime())) throw new Error(`Invalid DateTime value: ${String(value)}`);
      return d;
    }
    throw new Error('DateTime input must be a string or number');
  },
  parseLiteral(ast): Date {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      return new Date(ast.value);
    }
    throw new Error('DateTime literal must be a string');
  },
});

// ─── JSON scalar ─────────────────────────────────────────────────────────────

function parseJsonLiteral(ast: ValueNode): unknown {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT: {
      const obj: Record<string, unknown> = {};
      for (const field of ast.fields) {
        obj[field.name.value] = parseJsonLiteral(field.value);
      }
      return obj;
    }
    case Kind.LIST:
      return ast.values.map((v) => parseJsonLiteral(v));
    case Kind.NULL:
      return null;
    default:
      return undefined;
  }
}

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value',
  serialize: (value: unknown): unknown => value,
  parseValue: (value: unknown): unknown => value,
  parseLiteral: (ast: ValueNode): unknown => parseJsonLiteral(ast),
});

// Register on the builder
builder.addScalarType('DateTime', DateTimeScalar, {});
builder.addScalarType('JSON', JSONScalar, {});
