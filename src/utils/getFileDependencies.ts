interface DependencyData {
  importsDeclarations: string[];
  reverseImports: string[];
}

type DependenciesData = Record<string, DependencyData>;

export function getFileDependencies(
  data: DependenciesData,
  filePath: string,
  visited: Set<string> = new Set()
): DependenciesData {
  // Если файл уже был посещен, возвращаем пустой объект
  if (visited.has(filePath)) {
    return {};
  }

  // Добавляем файл в посещенные
  visited.add(filePath);

  // Если файл не найден в данных, считаем его файлом библиотеки
  if (!data[filePath]) {
    return {
      [filePath]: {
        importsDeclarations: [],
        reverseImports: []
      }
    };
  }

  // Получаем данные о зависимостях файла
  const fileData = data[filePath];
  const result: DependenciesData = {
    [filePath]: fileData
  };

  // Рекурсивно получаем зависимости для всех родителей
  for (const parent of fileData.reverseImports) {
    const parentDeps = getFileDependencies(data, parent, visited);
    Object.assign(result, parentDeps);
  }

  return result;
}
