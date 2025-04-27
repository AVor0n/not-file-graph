import dependencyTree from 'dependency-tree';
import * as path from 'path';
import * as fs from 'fs';
import { DependencyData } from './validateDependencies';
import * as vscode from 'vscode';
import { minimatch } from 'minimatch';

interface TreeInnerNode {
  [key: string]: string | TreeInnerNode;
}

interface Tree {
  [key: string]: TreeInnerNode;
}

interface DependencyTreeOptions {
  filename: string;
  directory: string;
  filter?: (path: string) => boolean;
  requireConfig?: string;
  webpackConfig?: string;
  tsConfig?: string;
  nodeModulesConfig?: any;
  detective?: any;
  visited?: Tree;
  nonExistent?: string[];
  isListForm?: boolean;
}

export async function generateDependencies(workspaceRoot: string): Promise<Record<string, DependencyData>> {
  // Получаем настройки
  const config = vscode.workspace.getConfiguration('not-file-graph');
  const ignorePatterns = config.get<string[]>('ignorePatterns') || ['node_modules/**', 'dist/**', '.git/**'];
  const tsconfigPath = config.get<string>('tsconfigPath');

  // Проверяем существование tsconfig.json
  let tsConfig: string | undefined;
  if (tsconfigPath) {
    const fullTsConfigPath = path.join(workspaceRoot, tsconfigPath);
    if (fs.existsSync(fullTsConfigPath)) {
      tsConfig = fullTsConfigPath;
    }
  }

  // Находим все js, jsx, ts, tsx файлы в проекте
  const files = await findFiles(workspaceRoot, ['.js', '.jsx', '.ts', '.tsx']);

  const dependencies: Record<string, DependencyData> = {};

  // Для каждого файла получаем его зависимости
  for (const file of files) {
    const relativePath = path.relative(workspaceRoot, file);

    // Проверяем, не игнорируется ли файл
    if (ignorePatterns.some(pattern => minimatch(relativePath, pattern))) {
      continue;
    }

    const tree = dependencyTree.toList({
      filename: file,
      directory: workspaceRoot,
      filter: (filePath: string) => {
        const ext = path.extname(filePath);
        const relativePath = path.relative(workspaceRoot, filePath);

        // Проверяем расширение и паттерны игнорирования
        return ['.js', '.jsx', '.ts', '.tsx'].includes(ext) &&
               !ignorePatterns.some(pattern => minimatch(relativePath, pattern));
      },
      tsConfig // Передаем путь к tsconfig.json если он существует
    });

    // Преобразуем дерево зависимостей в нужный формат
    const importsDeclarations: string[] = [];
    const reverseImports: string[] = [];

    // Добавляем зависимости
    for (const dep of tree) {
      const relativeImportPath = path.relative(workspaceRoot, dep);
      importsDeclarations.push(relativeImportPath);

      // Добавляем обратную зависимость
      if (!dependencies[relativeImportPath]) {
        dependencies[relativeImportPath] = {
          importsDeclarations: [],
          reverseImports: []
        };
      }
      dependencies[relativeImportPath].reverseImports.push(relativePath);
    }

    dependencies[relativePath] = {
      importsDeclarations,
      reverseImports
    };
  }

  return dependencies;
}

async function findFiles(dir: string, extensions: string[]): Promise<string[]> {
  const files: string[] = [];

  async function traverse(currentDir: string) {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Пропускаем node_modules и .git
        if (entry.name === 'node_modules' || entry.name === '.git') {
          continue;
        }
        await traverse(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  await traverse(dir);
  return files;
}
