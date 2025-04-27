export interface DependencyData {
  importsDeclarations: string[];
  reverseImports: string[];
}

type DependenciesData = Record<string, DependencyData>;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateDependencies(data: unknown): DependenciesData {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Данные должны быть объектом');
  }

  const dependencies = data as Record<string, unknown>;

  for (const [filePath, fileData] of Object.entries(dependencies)) {
    if (typeof filePath !== 'string') {
      throw new ValidationError(`Путь к файлу должен быть строкой, получено: ${typeof filePath}`);
    }

    if (!fileData || typeof fileData !== 'object') {
      throw new ValidationError(`Данные для файла ${filePath} должны быть объектом`);
    }

    const { importsDeclarations, reverseImports } = fileData as Record<string, unknown>;

    if (!Array.isArray(importsDeclarations)) {
      throw new ValidationError(`Поле importsDeclarations для файла ${filePath} должно быть массивом`);
    }

    if (!Array.isArray(reverseImports)) {
      throw new ValidationError(`Поле reverseImports для файла ${filePath} должно быть массивом`);
    }

    for (const importPath of importsDeclarations) {
      if (typeof importPath !== 'string') {
        throw new ValidationError(`Пути в importsDeclarations для файла ${filePath} должны быть строками`);
      }
    }

    for (const importPath of reverseImports) {
      if (typeof importPath !== 'string') {
        throw new ValidationError(`Пути в reverseImports для файла ${filePath} должны быть строками`);
      }
    }
  }

  return data as DependenciesData;
}
