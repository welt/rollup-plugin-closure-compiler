/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CompileOptions } from 'google-closure-compiler';
import * as fs from 'fs';
import { promisify } from 'util';
import {
  OutputOptions,
  RawSourceMap,
  Plugin,
  InputOptions,
  PluginContext,
  RenderedChunk,
  OutputBundle,
} from 'rollup';
import compiler from './compiler';
import options from './options';
import { preCompilation, createTransforms } from './transforms';
import { Transform } from './types';
import * as ESTree from 'estree';
// import MagicString from 'magic-string';
import { parse, walk } from './acorn';

const readFile = promisify(fs.readFile);

/**
 * Transform the tree-shaken code from Rollup with Closure Compiler (with derived configuration and transforms)
 * @param compileOptions Closure Compiler compilation options from Rollup configuration.
 * @param transforms Transforms to apply to source followin Closure Compiler completion.
 * @param code Source to compile.
 * @param outputOptions Rollup Output Options.
 * @return Closure Compiled form of the Rollup Chunk
 */
const renderChunk = async (
  transforms: Array<Transform>,
  requestedCompileOptions: CompileOptions = {},
  sourceCode: string,
  outputOptions: OutputOptions,
): Promise<{ code: string; map: RawSourceMap } | null> => {
  const code = await preCompilation(sourceCode, outputOptions, transforms);
  const [compileOptions, mapFile] = options(
    requestedCompileOptions,
    outputOptions,
    code,
    transforms,
  );

  return compiler(compileOptions, transforms).then(
    async code => {
      return { code, map: JSON.parse(await readFile(mapFile, 'utf8')) };
    },
    (error: Error) => {
      throw error;
    },
  );
};

// When a dynamic import is discovered.
// 1. Analyze the exports of the dynamic import.
// 2. Create an extern definition of the exports, and if they are functions their shape.
//    { 'name': function(arg1, arg2, ...), 'another': number, ... }
// 3. Attach this extern defition importer of the dynamic import.
// 4. When creating the extern for each file containing a dynamic import, include the discovered extern.

// const INPUT_TO_DYNAMIC_IMPORT_EXTERN = new Map<string, Array<{ name: string; value: string }>>();
const DYNAMIC_IMPORTS_TO_PARSE: Array<string> = [];

export default function closureCompiler(requestedCompileOptions: CompileOptions = {}): Plugin {
  let inputOptions: InputOptions;
  let context: PluginContext;

  return {
    name: 'closure-compiler',
    options: options => (inputOptions = options),
    buildStart() {
      context = this;
    },
    load: async (id: string) => {
      console.log('load', id);
      const externs: Array<{ name: string; value: string }> = [];

      if (DYNAMIC_IMPORTS_TO_PARSE.includes(id)) {
        // This load is for a dynamic import detected earlier.
        const code = await readFile(id, 'utf8');
        const program = parse(code);

        walk.simple(program, {
          ExportNamedDeclaration(node: ESTree.ExportNamedDeclaration) {
            if (node.declaration) {
              switch (node.declaration.type) {
                case 'FunctionDeclaration':
                  if (node.declaration.id !== null) {
                    externs.push({
                      name: node.declaration.id.name,
                      value: `function ${node.declaration.id.name}(${node.declaration.params
                        .map((param, index) => `arg${index}`)
                        .join(',')}){}`,
                    });
                  }

                  break;
                case 'VariableDeclaration':
                  break;
                default:
                  context.warn('Rollup Closure Compiler unable to handle export in dynamic import');
              }
            }
          },
        });
      }

      console.log('load, ', externs);
      return null;
      /*
      export type LoadHook = (
        this: PluginContext,
        id: string
      ) => Promise<SourceDescription | string | null> | SourceDescription | string | null;
      */
    },
    resolveDynamicImport: async (specifier: string | ESTree.Node, parentId: string) => {
      console.log('resolve dynamic-import', specifier, parentId);
      if (typeof specifier === 'string') {
        const resolvedId = await context.resolveId(specifier, parentId);
        console.log('resolve dynamic-import, ', resolvedId);

        if (typeof resolvedId === 'string') {
          if (!DYNAMIC_IMPORTS_TO_PARSE.includes(resolvedId)) {
            DYNAMIC_IMPORTS_TO_PARSE.push(resolvedId);
          }
        } else {
          context.error(
            `Rollup Plugin Closure Compiler was unable to resolve a dynamic import (${specifier}) in parentId (${parentId}).`,
          );
        }
      } else {
        context.error(
          'Rollup Plugin Closure Compiler only supports dynamically importing string based references.',
        );
      }

      /*
      export type ResolveDynamicImportHook = (
        this: PluginContext,
        specifier: string | ESTree.Node,
        parentId: string
      ) => Promise<string | void> | string | void;
      */
    },
    generateBundle(options: OutputOptions, bundle: OutputBundle, isWrite: boolean) {
      console.log('generate bundle');
    },
    renderChunk: async (code: string, chunk: RenderedChunk, outputOptions: OutputOptions) => {
      console.log('render chunk', chunk.name, chunk);
      const transforms = createTransforms(context, inputOptions);
      return await renderChunk(transforms, requestedCompileOptions, code, outputOptions);
    },
  };
}
