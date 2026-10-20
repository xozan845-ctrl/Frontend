/**
 * Análisis estático ligero de TypeScript (sin parser): enmascara comentarios y
 * strings preservando offsets/líneas, y extrae imports, declaraciones de tipo e
 * inyecciones. Genérico: recibe texto, no conoce el proyecto.
 */

/**
 * Reemplaza comentarios y literales de string/template por espacios,
 * preservando saltos de línea (y por tanto los números de línea).
 */
export function maskSource(src) {
  let out = '';
  let i = 0;
  const n = src.length;

  const blank = (count, ch = ' ') => {
    for (let k = 0; k < count; k += 1) out += ch;
  };

  while (i < n) {
    const c = src[i];
    const next = src[i + 1];

    if (c === '/' && next === '/') {
      while (i < n && src[i] !== '\n') {
        out += ' ';
        i += 1;
      }
      continue;
    }

    if (c === '/' && next === '*') {
      blank(2);
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        out += src[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      blank(2);
      i += 2;
      continue;
    }

    if (c === "'" || c === '"' || c === '`') {
      const quote = c;
      out += ' ';
      i += 1;
      while (i < n) {
        if (src[i] === '\\') {
          blank(2);
          i += 2;
          continue;
        }
        if (src[i] === quote) {
          out += ' ';
          i += 1;
          break;
        }
        out += src[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      continue;
    }

    out += c;
    i += 1;
  }

  return out;
}

/** Reemplaza solo comentarios (conserva strings; necesario para leer imports). */
export function maskComments(src) {
  let out = '';
  let i = 0;
  const n = src.length;

  while (i < n) {
    const c = src[i];
    const next = src[i + 1];

    if (c === '/' && next === '/') {
      while (i < n && src[i] !== '\n') {
        out += ' ';
        i += 1;
      }
      continue;
    }

    if (c === '/' && next === '*') {
      out += '  ';
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        out += src[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      out += '  ';
      i += 2;
      continue;
    }

    if (c === "'" || c === '"' || c === '`') {
      const quote = c;
      out += c;
      i += 1;
      while (i < n) {
        if (src[i] === '\\') {
          out += src[i] + (src[i + 1] ?? '');
          i += 2;
          continue;
        }
        out += src[i];
        if (src[i] === quote) {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    out += c;
    i += 1;
  }

  return out;
}

/** Número de línea (1-based) de un índice del texto enmascarado. */
export function lineAt(masked, index) {
  return masked.slice(0, index).split('\n').length;
}

/**
 * Extrae los specifiers importados (estáticos, re-exports y dinámicos).
 * @returns {Array<{ specifier: string, line: number }>}
 */
export function extractImports(src) {
  const masked = maskComments(src);
  const results = [];
  const patterns = [
    /(?:^|\n)\s*(?:import|export)\s+(?:type\s+)?[^'"\n;]*?\s+from\s+['"]([^'"]+)['"]/g,
    /(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const re of patterns) {
    let match;
    while ((match = re.exec(masked))) {
      results.push({ specifier: match[1], line: lineAt(masked, match.index) });
    }
  }

  return results;
}

/**
 * Declaraciones `interface`, `enum` y `type X =` (no re-exports ni imports).
 * @returns {Array<{ kind: string, name: string, line: number }>}
 */
export function extractTypeDeclarations(src) {
  const masked = maskSource(src);
  const results = [];
  const re =
    /(?:^|\n)\s*(?:export\s+)?(?:declare\s+)?(interface|enum)\s+([A-Za-z_$][\w$]*)|(?:^|\n)\s*(?:export\s+)?(?:declare\s+)?type\s+([A-Za-z_$][\w$]*)\s*(?:<[^>]*>)?\s*=/g;

  let match;
  while ((match = re.exec(masked))) {
    results.push({
      kind: match[1] ?? 'type',
      name: match[2] ?? match[3],
      line: lineAt(masked, match.index),
    });
  }

  return results;
}

/** Tokens inyectados con `inject(Token)`. */
export function extractInjections(src) {
  const masked = maskSource(src);
  const results = [];
  const re = /\binject\s*\(\s*([A-Za-z_$][\w$]*)\s*\)/g;
  let match;
  while ((match = re.exec(masked))) {
    results.push({ token: match[1], line: lineAt(masked, match.index) });
  }
  return results;
}

/** ¿El archivo inyecta `HttpClient` directamente? */
export function injectsHttpClient(src) {
  return extractInjections(src).some(({ token }) => token === 'HttpClient');
}

/** ¿El texto enmascarado contiene código en tiempo de ejecución (no sólo tipos)? */
export function hasRuntimeCode(src) {
  const masked = maskSource(src);
  return /(?:^|\n)\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?(?:class|const|let|var|function)\b|@(?:Component|Injectable|Directive|Pipe|NgModule)\b/.test(
    masked,
  );
}

/** ¿Es una declaración de tipo derivada de una constante, p. ej. `(typeof X)[number]`? */
export function isDerivedConstType(src, declaration) {
  const masked = maskSource(src);
  const index = masked.indexOf(`type ${declaration.name}`);
  if (index < 0) return false;
  const start = Math.max(0, masked.lastIndexOf('\n', index));
  const snippet = masked.slice(start, start + 200);
  return /\(typeof\s+[A-Za-z_$][\w$]*\)\s*\[\s*number\s*\]/.test(snippet);
}
