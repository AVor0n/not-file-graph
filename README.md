# Not File Graph

Расширение для VS Code, которое визуализирует зависимости между файлами в проекте.

![](./resources/screen1.png)

## Возможности

- Визуализация зависимостей между JavaScript/TypeScript файлами в виде графа
- Подсветка корневых узлов (файлов без зависимостей) синим цветом
- Подсветка выбранного файла красным цветом
- Возможность открыть файл по клику на узел графа
- Автоматическое центрирование графа на выбранном файле
- Автоматическая генерация файла зависимостей с помощью библиотеки dependency-tree

## Команды

- `Not File Graph: Select File` - открыть диалог выбора файла для построения графа
- `Not File Graph: Show Current File Graph` - построить граф для текущего активного файла
- `Not File Graph: Generate Dependencies` - сгенерировать файл зависимостей для проекта

## Контекстное меню

В контекстном меню файлов JavaScript/TypeScript (правый клик на файле) доступны команды:
- `Not File Graph: Select File` - построить граф для выбранного файла
- `Not File Graph: Generate Dependencies` - сгенерировать файл зависимостей для проекта

## Настройка

Расширение может работать в двух режимах:

1. Автоматическая генерация зависимостей:
   - Используйте команду `Not File Graph: Generate Dependencies` для создания файла `dependencies.json` в корне проекта
   - Расширение автоматически настроит путь к файлу зависимостей

2. Ручная настройка:
   - Создайте файл с зависимостями в формате JSON
   - Укажите путь к файлу в настройке `not-file-graph.sourceFilePath`

Формат файла зависимостей:
```json
{
    "file1.ts": {
        "importsDeclarations": ["file2.ts", "file3.ts"],
        "reverseImports": []
    },
    "file2.ts": {
        "importsDeclarations": ["file2.ts"],
        "reverseImports": ["file1.ts"]
    },
    "file3.ts": {
        "importsDeclarations": [],
        "reverseImports": ["file1.ts", "file2.ts"]
    }
}
```

## Требования

- VS Code версии 1.99.0 или выше
- JavaScript/TypeScript проект

## Лицензия

MIT
