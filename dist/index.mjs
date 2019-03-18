import { readFile } from 'fs';
import { promisify } from 'util';
import { compiler } from 'google-closure-compiler';
import { sync } from 'temp-write';
import { extname, resolve } from 'path';
import MagicString from 'magic-string';

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
const dynamicImport = require('acorn-dynamic-import');
const DYNAMIC_IMPORT_DECLARATION = dynamicImport.DynamicImportKey;
const IMPORT_SPECIFIER = 'ImportSpecifier';
const IMPORT_DEFAULT_SPECIFIER = 'ImportDefaultSpecifier';
const IMPORT_NAMESPACE_SPECIFIER = 'ImportNamespaceSpecifier';
var ExportClosureMapping;
(function (ExportClosureMapping) {
    ExportClosureMapping[ExportClosureMapping["NAMED_FUNCTION"] = 0] = "NAMED_FUNCTION";
    ExportClosureMapping[ExportClosureMapping["NAMED_CLASS"] = 1] = "NAMED_CLASS";
    ExportClosureMapping[ExportClosureMapping["NAMED_DEFAULT_FUNCTION"] = 2] = "NAMED_DEFAULT_FUNCTION";
    ExportClosureMapping[ExportClosureMapping["DEFAULT_FUNCTION"] = 3] = "DEFAULT_FUNCTION";
    ExportClosureMapping[ExportClosureMapping["NAMED_DEFAULT_CLASS"] = 4] = "NAMED_DEFAULT_CLASS";
    ExportClosureMapping[ExportClosureMapping["DEFAULT_CLASS"] = 5] = "DEFAULT_CLASS";
    ExportClosureMapping[ExportClosureMapping["NAMED_CONSTANT"] = 6] = "NAMED_CONSTANT";
    ExportClosureMapping[ExportClosureMapping["DEFAULT"] = 7] = "DEFAULT";
    ExportClosureMapping[ExportClosureMapping["DEFAULT_VALUE"] = 8] = "DEFAULT_VALUE";
    ExportClosureMapping[ExportClosureMapping["DEFAULT_OBJECT"] = 9] = "DEFAULT_OBJECT";
})(ExportClosureMapping || (ExportClosureMapping = {}));
class Transform {
    constructor(context, inputOptions) {
        this.context = context;
        this.inputOptions = inputOptions;
    }
    extern(options) {
        return '';
    }
    async preCompilation(code) {
        return {
            code,
        };
    }
    async postCompilation(code) {
        return {
            code,
        };
    }
    isEntryPoint(id) {
        const inputs = (input) => {
            if (typeof input === 'string') {
                return [input];
            }
            else if (typeof input === 'object') {
                return Object.values(input);
            }
            else {
                return input;
            }
        };
        return inputs(this.inputOptions.input)
            .map(input => resolve(input))
            .includes(id);
    }
}

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
const HEADER = `/**
* @fileoverview Externs built via derived configuration from Rollup or input code.
* This extern contains the iife name so it does not get mangled at the top level.
* @externs
*/
`;
/**
 * This Transform will apply only if the Rollup configuration is for a iife output with a defined name.
 *
 * In order to preserve the name of the iife output, derive an extern definition for Closure Compiler.
 * This preserves the name after compilation since Closure now believes it to be a well known global.
 */
class IifeTransform extends Transform {
    extern(options) {
        if (options.format === 'iife' && options.name) {
            return HEADER + `function ${options.name}(){};\n`;
        }
        return '';
    }
}

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
const acorn = require('acorn');
const acornWalk = require('acorn-walk');
const dynamicImport$1 = require('acorn-dynamic-import');
const DYNAMIC_IMPORT_BASEVISITOR = Object.assign({}, acornWalk.base, {
    [DYNAMIC_IMPORT_DECLARATION]: () => { },
});
const walk = {
    simple(node, visitors) {
        acornWalk.simple(node, visitors, DYNAMIC_IMPORT_BASEVISITOR);
    },
    ancestor(node, visitors) {
        acornWalk.ancestor(node, visitors, DYNAMIC_IMPORT_BASEVISITOR);
    },
};
const DEFAULT_ACORN_OPTIONS = {
    ecmaVersion: 2019,
    sourceType: 'module',
    preserveParens: false,
    ranges: true,
};
function parse(source) {
    return acorn.Parser.extend(dynamicImport$1.default).parse(source, DEFAULT_ACORN_OPTIONS);
}

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
/**
 * Closure Compiler will not transform computed keys with literal values back to the literal value.
 * e.g {[0]: 'value'} => {0: 'value'}
 *
 * This transform does so only if a computed key is a Literal, and thus easily known to be static.
 * @see https://astexplorer.net/#/gist/d2414b45a81db3a41ee6902bfd09947a/d7176ac33a2733e1a4b1f65ec3ac626e24f7b60d
 */
class LiteralComputedKeys extends Transform {
    /**
     * @param code source to parse, and modify
     * @return modified input source with computed literal keys
     */
    async postCompilation(code) {
        const source = new MagicString(code);
        const program = parse(code);
        walk.simple(program, {
            ObjectExpression(node) {
                const properties = node.properties;
                properties.forEach(property => {
                    if (property.computed &&
                        property.key.type === 'Literal' &&
                        property.range &&
                        property.value.range) {
                        source.overwrite(property.range[0], property.value.range[0], `${property.key.value}${property.value.type !== 'FunctionExpression' ? ':' : ''}`);
                    }
                });
            },
        });
        return {
            code: source.toString(),
            map: source.generateMap().mappings,
        };
    }
}

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
function functionDeclarationName(context, declaration) {
    // For the Declaration passed, there can be a function declaration.
    if (declaration.declaration && declaration.declaration.type === 'FunctionDeclaration') {
        const functionDeclaration = declaration.declaration;
        if (functionDeclaration !== null &&
            functionDeclaration.id !== null &&
            functionDeclaration.id.name !== null) {
            return functionDeclaration.id.name;
        }
    }
    return null;
}
function classDeclarationName(context, declaration) {
    // For the Declaration passed, there can be a function declaration.
    if (declaration.declaration && declaration.declaration.type === 'ClassDeclaration') {
        const classDeclaration = declaration.declaration;
        if (classDeclaration !== null &&
            classDeclaration.id !== null &&
            classDeclaration.id.name !== null) {
            // This class declaration is the export name we need to know.
            return classDeclaration.id.name;
        }
    }
    return null;
}
function NamedDeclaration(context, declaration) {
    const functionName = functionDeclarationName(context, declaration);
    const className = classDeclarationName(context, declaration);
    // TODO(KB): This logic isn't great. If something has a named declaration, lets instead use the AST to find out what it is.
    // var Foo=function(){}export{Foo as default} => default export function
    if (functionName !== null) {
        return {
            [functionName]: {
                alias: null,
                type: ExportClosureMapping.NAMED_FUNCTION,
                range: [
                    declaration.range ? declaration.range[0] : 0,
                    declaration.range ? declaration.range[1] : 0,
                ],
            },
        };
    }
    else if (className !== null) {
        return {
            [className]: {
                alias: null,
                type: ExportClosureMapping.NAMED_CLASS,
                range: [
                    declaration.range ? declaration.range[0] : 0,
                    declaration.range ? declaration.range[1] : 0,
                ],
            },
        };
    }
    else if (declaration.declaration && declaration.declaration.type === 'VariableDeclaration') {
        const variableDeclarations = declaration.declaration.declarations;
        const exportMap = {};
        variableDeclarations.forEach(variableDeclarator => {
            if (variableDeclarator.id.type === 'Identifier') {
                exportMap[variableDeclarator.id.name] = {
                    alias: null,
                    type: ExportClosureMapping.NAMED_CONSTANT,
                    range: [
                        declaration.range ? declaration.range[0] : 0,
                        declaration.range ? declaration.range[1] : 0,
                    ],
                };
            }
        });
        return exportMap;
    }
    else if (declaration.specifiers) {
        const exportMap = {};
        declaration.specifiers.forEach(exportSpecifier => {
            if (exportSpecifier.exported.name === 'default') {
                // This is a default export in a specifier list.
                // e.g. export { foo as default };
                exportMap[exportSpecifier.local.name] = {
                    alias: null,
                    type: ExportClosureMapping.DEFAULT,
                    range: [
                        declaration.range ? declaration.range[0] : 0,
                        declaration.range ? declaration.range[1] : 0,
                    ],
                };
            }
            else {
                exportMap[exportSpecifier.local.name] = {
                    alias: exportSpecifier.local.name !== exportSpecifier.exported.name
                        ? exportSpecifier.exported.name
                        : null,
                    type: ExportClosureMapping.NAMED_CONSTANT,
                    range: [
                        declaration.range ? declaration.range[0] : 0,
                        declaration.range ? declaration.range[1] : 0,
                    ],
                };
            }
        });
        return exportMap;
    }
    return null;
}
function DefaultDeclaration(context, declaration) {
    if (declaration.declaration) {
        switch (declaration.declaration.type) {
            case 'FunctionDeclaration':
                const functionName = functionDeclarationName(context, declaration);
                if (functionName !== null) {
                    return {
                        [functionName]: {
                            alias: null,
                            type: ExportClosureMapping.NAMED_DEFAULT_FUNCTION,
                            range: [
                                declaration.range ? declaration.range[0] : 0,
                                declaration.range ? declaration.range[1] : 0,
                            ],
                        },
                    };
                }
                break;
            case 'ClassDeclaration':
                const className = classDeclarationName(context, declaration);
                if (className !== null) {
                    return {
                        [className]: {
                            alias: null,
                            type: ExportClosureMapping.NAMED_DEFAULT_CLASS,
                            range: [
                                declaration.range ? declaration.range[0] : 0,
                                declaration.range ? declaration.range[1] : 0,
                            ],
                        },
                    };
                }
                break;
            case 'Identifier':
                if (declaration.declaration.name) {
                    return {
                        [declaration.declaration.name]: {
                            alias: null,
                            type: ExportClosureMapping.NAMED_DEFAULT_FUNCTION,
                            range: [
                                declaration.range ? declaration.range[0] : 0,
                                declaration.range ? declaration.range[1] : 0,
                            ],
                        },
                    };
                }
                break;
            case 'Identifier':
                if (declaration.declaration.name) {
                    return {
                        [declaration.declaration.name]: {
                            alias: null,
                            type: ExportClosureMapping.NAMED_DEFAULT_FUNCTION,
                            range: [
                                declaration.range ? declaration.range[0] : 0,
                                declaration.range ? declaration.range[1] : 0,
                            ],
                        },
                    };
                }
                break;
        }
    }
    return null;
}
function literalName(context, literal) {
    // Literal can either be a SimpleLiteral, or RegExpLiteral
    if ('regex' in literal) {
        // This is a RegExpLiteral
        context.warn('Rollup Plugin Closure Compiler found a Regex Literal Named Import. `import foo from "*/.hbs"`');
        return '';
    }
    const literalValue = literal.value;
    return typeof literalValue === 'string' ? literalValue : '';
}
function importLocalNames(context, declaration) {
    const returnableSpecifiers = [];
    if (declaration.specifiers) {
        declaration.specifiers.forEach(specifier => {
            switch (specifier.type) {
                case IMPORT_SPECIFIER:
                case IMPORT_NAMESPACE_SPECIFIER:
                case IMPORT_DEFAULT_SPECIFIER:
                    returnableSpecifiers.push(specifier.local.name);
                    break;
                default:
                    break;
            }
        });
    }
    return returnableSpecifiers;
}

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
const ERROR_WARNINGS_ENABLED_LANGUAGE_OUT_UNSPECIFIED = 'Providing the warning_level=VERBOSE compile option also requires a valid language_out compile option.';
const ERROR_WARNINGS_ENABLED_LANGUAGE_OUT_INVALID = 'Providing the warning_level=VERBOSE and language_out=NO_TRANSPILE compile option will remove warnings.';
/**
 * Checks if output format is ESM
 * @param format
 * @return boolean
 */
const isESMFormat = (format) => {
    // TODO: remove `| 'esm'` when rollup upgrades its typings
    return format === 'esm' || format === 'es';
};
/**
 * Throw Errors if compile options will result in unexpected behaviour.
 * @param compileOptions
 */
const validateCompileOptions = (compileOptions) => {
    if ('warning_level' in compileOptions && compileOptions.warning_level === 'VERBOSE') {
        if (!('language_out' in compileOptions)) {
            throw new Error(ERROR_WARNINGS_ENABLED_LANGUAGE_OUT_UNSPECIFIED);
        }
        else if ('language_out' in compileOptions && compileOptions.language_out === 'NO_TRANSPILE') {
            throw new Error(ERROR_WARNINGS_ENABLED_LANGUAGE_OUT_INVALID);
        }
    }
};
/**
 * Generate default Closure Compiler CompileOptions an author can override if they wish.
 * These must be derived from configuration or input sources.
 * @param transformers
 * @param options
 * @return derived CompileOptions for Closure Compiler
 */
const defaults = (options, providedExterns, transformers) => {
    // Defaults for Rollup Projects are slightly different than Closure Compiler defaults.
    // - Users of Rollup tend to transpile their code before handing it to a minifier,
    // so no transpile is default.
    // - When Rollup output is set to "es" it is expected the code will live in a ES Module,
    // so safely be more aggressive in minification.
    // - When Rollup is configured to output an iife, ensure Closure Compiler does not
    // mangle the name of the iife wrapper.
    const externs = transformers
        ? transformers
            .map(transform => {
            const extern = transform.extern(options);
            return extern !== '' ? sync(extern) : false;
        })
            .filter(Boolean)
            .concat(providedExterns)
        : providedExterns.length > 0
            ? providedExterns
            : '';
    return {
        language_out: 'NO_TRANSPILE',
        assume_function_wrapper: isESMFormat(options.format),
        warning_level: 'QUIET',
        module_resolution: 'NODE',
        externs,
    };
};
/**
 * Compile Options is the final configuration to pass into Closure Compiler.
 * defaultCompileOptions are overrideable by ones passed in directly to the plugin
 * but the js source and sourcemap are not overrideable, since this would break the output if passed.
 * @param compileOptions
 * @param outputOptions
 * @param code
 * @param transforms
 */
function options (incomingCompileOptions, outputOptions, code, transforms) {
    const mapFile = sync('');
    const compileOptions = Object.assign({}, incomingCompileOptions);
    let externs = [];
    validateCompileOptions(compileOptions);
    if ('externs' in compileOptions) {
        switch (typeof compileOptions.externs) {
            case 'boolean':
                externs = [];
                break;
            case 'string':
                externs = [compileOptions.externs];
                break;
            default:
                externs = compileOptions.externs;
                break;
        }
        delete compileOptions.externs;
    }
    const options = Object.assign({}, defaults(outputOptions, externs, transforms), compileOptions, { js: sync(code), create_source_map: mapFile });
    return [options, mapFile];
}

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
/**
 * This Transform will apply only if the Rollup configuration is for 'esm' output.
 *
 * In order to preserve the export statements:
 * 1. Create extern definitions for them (to keep them their names from being mangled).
 * 2. Insert additional JS referencing the exported names on the window scope
 * 3. After Closure Compilation is complete, replace the window scope references with the original export statements.
 */
class ExportTransform extends Transform {
    constructor() {
        super(...arguments);
        this.originalExports = {};
    }
    async deriveExports(code) {
        const context = this.context;
        let originalExports = {};
        const program = parse(code);
        walk.simple(program, {
            ExportNamedDeclaration(node) {
                const namedDeclarationValues = NamedDeclaration(context, node);
                if (namedDeclarationValues !== null) {
                    originalExports = Object.assign({}, originalExports, namedDeclarationValues);
                }
            },
            ExportDefaultDeclaration(node) {
                const defaultDeclarationValue = DefaultDeclaration(context, node);
                if (defaultDeclarationValue !== null) {
                    originalExports = Object.assign({}, originalExports, defaultDeclarationValue);
                }
            },
            ExportAllDeclaration(node) {
                // TODO(KB): This case `export * from "./import"` is not currently supported.
                context.error(new Error(`Rollup Plugin Closure Compiler does not support export all syntax for externals.`));
            },
        });
        return originalExports;
    }
    /**
     * Before Closure Compiler modifies the source, we need to ensure it has window scoped
     * references to the named exports. This prevents Closure from mangling their names.
     * @param code source to parse, and modify
     * @param chunk OutputChunk from Rollup for this code.
     * @param id Rollup id reference to the source
     * @return modified input source with window scoped references.
     */
    async preCompilation(code) {
        if (this.outputOptions === null) {
            this.context.warn('Rollup Plugin Closure Compiler, OutputOptions not known before Closure Compiler invocation.');
        }
        else if (isESMFormat(this.outputOptions.format)) {
            const source = new MagicString(code);
            this.originalExports = await this.deriveExports(code);
            Object.keys(this.originalExports).forEach(key => {
                // Remove export statements before Closure Compiler sees the code
                // This prevents CC from transpiling `export` statements when the language_out is set to a value
                // where exports were not part of the language.
                source.remove(this.originalExports[key].range[0], this.originalExports[key].range[1]);
                // Window scoped references for each key are required to ensure Closure Compilre retains the code.
                source.append(`\nwindow['${key}'] = ${key};`);
            });
            return {
                code: source.toString(),
                map: source.generateMap().mappings,
            };
        }
        return {
            code,
        };
    }
    /**
     * After Closure Compiler has modified the source, we need to replace the window scoped
     * references we added with the intended export statements
     * @param code source post Closure Compiler Compilation
     * @param chunk OutputChunk from Rollup for this code.
     * @param id Rollup identifier for the source
     * @return Promise containing the repaired source
     */
    async postCompilation(code) {
        if (this.outputOptions === null) {
            this.context.warn('Rollup Plugin Closure Compiler, OutputOptions not known before Closure Compiler invocation.');
        }
        else if (isESMFormat(this.outputOptions.format)) {
            const source = new MagicString(code);
            const program = parse(code);
            const collectedExportsToAppend = [];
            const originalExports = this.originalExports;
            const originalExportIdentifiers = Object.keys(originalExports);
            source.trimEnd();
            walk.ancestor(program, {
                // We inserted window scoped assignments for all the export statements during `preCompilation`
                // window['exportName'] = exportName;
                // Now we need to find where Closure Compiler moved them, and restore the exports of their name.
                // ASTExporer Link: https://astexplorer.net/#/gist/94f185d06a4105d64828f1b8480bddc8/0fc5885ae5343f964d0cdd33c7d392a70cf5fcaf
                Identifier(node, ancestors) {
                    if (node.name === 'window') {
                        ancestors.forEach((ancestor) => {
                            if (ancestor.type === 'ExpressionStatement' &&
                                ancestor.expression.type === 'AssignmentExpression' &&
                                ancestor.expression.left.type === 'MemberExpression' &&
                                ancestor.expression.left.object.type === 'Identifier' &&
                                ancestor.expression.left.object.name === 'window' &&
                                ancestor.expression.left.property.type === 'Identifier' &&
                                originalExportIdentifiers.includes(ancestor.expression.left.property.name)) {
                                const exportName = ancestor.expression.left.property.name;
                                switch (originalExports[exportName].type) {
                                    case ExportClosureMapping.DEFAULT_FUNCTION:
                                    case ExportClosureMapping.NAMED_DEFAULT_FUNCTION:
                                    case ExportClosureMapping.DEFAULT:
                                        if (ancestor.expression.left.range) {
                                            source.overwrite(ancestor.expression.left.range[0], ancestor.expression.left.range[1] + ancestor.expression.operator.length, `export default `);
                                        }
                                        break;
                                    case ExportClosureMapping.NAMED_FUNCTION:
                                        if (ancestor.expression.right.type === 'FunctionExpression' &&
                                            ancestor.expression.right.params.length > 0) {
                                            const firstParameter = ancestor.expression.right.params[0];
                                            if (ancestor.expression.range && firstParameter.range) {
                                                source.overwrite(ancestor.expression.range[0], firstParameter.range[0] - 1, `export function ${ancestor.expression.left.property.name}`);
                                            }
                                        }
                                        break;
                                    case ExportClosureMapping.DEFAULT_CLASS:
                                    case ExportClosureMapping.NAMED_DEFAULT_CLASS:
                                        if (ancestor.expression.right.type === 'Identifier') {
                                            const mangledName = ancestor.expression.right.name;
                                            walk.simple(program, {
                                                ClassDeclaration(node) {
                                                    if (node.id &&
                                                        node.id.name === mangledName &&
                                                        node.range &&
                                                        node.body.range &&
                                                        ancestor.range) {
                                                        if (node.superClass && node.superClass.type === 'Identifier') {
                                                            source.overwrite(node.range[0], node.body.range[0], `export default class extends ${node.superClass.name}`);
                                                        }
                                                        else {
                                                            source.overwrite(node.range[0], node.body.range[0], `export default class`);
                                                        }
                                                        source.remove(ancestor.range[0], ancestor.range[1]);
                                                    }
                                                },
                                            });
                                        }
                                        break;
                                    case ExportClosureMapping.NAMED_CONSTANT:
                                        if (ancestor.expression.left.object.range) {
                                            source.overwrite(ancestor.expression.left.object.range[0], ancestor.expression.left.object.range[1] + 1, 'var ');
                                        }
                                        if (originalExports[exportName].alias !== null) {
                                            collectedExportsToAppend.push(`${ancestor.expression.left.property.name} as ${originalExports[exportName].alias}`);
                                        }
                                        else {
                                            collectedExportsToAppend.push(ancestor.expression.left.property.name);
                                        }
                                        break;
                                    case ExportClosureMapping.DEFAULT_VALUE:
                                    case ExportClosureMapping.DEFAULT_OBJECT:
                                        if (ancestor.expression.left.object.range && ancestor.expression.right.range) {
                                            source.overwrite(ancestor.expression.left.object.range[0], ancestor.expression.right.range[0], 'export default ');
                                        }
                                        break;
                                    default:
                                        if (ancestor.range) {
                                            source.remove(ancestor.range[0], ancestor.range[1]);
                                        }
                                        if (ancestor.expression.right.type === 'Identifier') {
                                            collectedExportsToAppend.push(`${ancestor.expression.right.name} as ${ancestor.expression.left.property.name}`);
                                        }
                                        break;
                                }
                            }
                        });
                    }
                },
            });
            if (collectedExportsToAppend.length > 0) {
                source.append(`export{${collectedExportsToAppend.join(',')}};`);
            }
            return {
                code: source.toString(),
                map: source.generateMap().mappings,
            };
        }
        return {
            code,
        };
    }
}

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
const DYNAMIC_IMPORT_KEYWORD = 'import';
const DYNAMIC_IMPORT_REPLACEMENT = `import_${new Date().getMilliseconds()}`;
const HEADER$1 = `/**
* @fileoverview Externs built via derived configuration from Rollup or input code.
* This extern contains the external import names, to prevent compilation failures.
* @externs
*/
`;
class ImportTransform extends Transform {
    constructor() {
        super(...arguments);
        this.importedExternalsSyntax = {};
        this.importedExternalsLocalNames = [];
        this.dynamicImportPresent = false;
    }
    /**
     * Generate externs for local names of external imports.
     * Otherwise, advanced mode compilation will fail since the reference is unknown.
     * @return string representing content of generated extern.
     */
    extern() {
        let extern = HEADER$1;
        if (this.importedExternalsLocalNames.length > 0) {
            this.importedExternalsLocalNames.forEach(name => {
                extern += `function ${name}(){};\n`;
            });
        }
        if (this.dynamicImportPresent) {
            extern += `
/**
 * @param {string} path
 * @return {!Promise<?>}
 */
function ${DYNAMIC_IMPORT_REPLACEMENT}(path) { return Promise.resolve(path) };
window['${DYNAMIC_IMPORT_REPLACEMENT}'] = ${DYNAMIC_IMPORT_REPLACEMENT};`;
        }
        return extern;
    }
    /**
     * Before Closure Compiler modifies the source, we need to ensure external imports have been removed
     * since Closure will error out when it encounters them.
     * @param code source to parse, and modify
     * @param chunk OutputChunk from Rollup for this code.
     * @param id Rollup id reference to the source
     * @return modified input source with external imports removed.
     */
    async preCompilation(code) {
        const self = this;
        const source = new MagicString(code);
        const program = parse(code);
        walk.simple(program, {
            async ImportDeclaration(node) {
                const name = literalName(self.context, node.source);
                const range = node.range ? [node.range[0], node.range[1]] : [0, 0];
                self.importedExternalsSyntax[name] = code.slice(range[0], range[1]);
                source.remove(range[0], range[1]);
                self.importedExternalsLocalNames = self.importedExternalsLocalNames.concat(importLocalNames(self.context, node));
            },
            Import(node) {
                self.dynamicImportPresent = true;
                // Rename the `import` method to something we can put in externs.
                // CC doesn't understand dynamic import yet.
                source.overwrite(node.range[0], node.range[1], code
                    .substring(node.range[0], node.range[1])
                    .replace(DYNAMIC_IMPORT_KEYWORD, DYNAMIC_IMPORT_REPLACEMENT));
            },
        });
        return {
            code: source.toString(),
            map: source.generateMap().mappings,
        };
    }
    /**
     * After Closure Compiler has modified the source, we need to re-add the external imports
     * @param code source post Closure Compiler Compilation
     * @return Promise containing the repaired source
     */
    async postCompilation(code) {
        const source = new MagicString(code);
        const program = parse(code);
        Object.values(this.importedExternalsSyntax).forEach(importedExternalSyntax => source.prepend(importedExternalSyntax));
        walk.simple(program, {
            Identifier(node) {
                if (node.name === DYNAMIC_IMPORT_REPLACEMENT) {
                    const range = node.range ? [node.range[0], node.range[1]] : [0, 0];
                    source.overwrite(range[0], range[1], DYNAMIC_IMPORT_KEYWORD);
                }
            },
        });
        return {
            code: source.toString(),
            map: source.generateMap().mappings,
        };
    }
}

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
class StrictTransform extends Transform {
    /**
     * When outputting an es module, runtimes automatically apply strict mode conventions.
     * This means we can safely strip the 'use strict'; declaration from the top of the file.
     * @param code source following closure compiler minification
     * @return code after removing the strict mode declaration (when safe to do so)
     */
    async postCompilation(code) {
        if (this.outputOptions === null) {
            this.context.warn('Rollup Plugin Closure Compiler, OutputOptions not known before Closure Compiler invocation.');
        }
        else if (isESMFormat(this.outputOptions.format) ||
            (this.outputOptions.file && extname(this.outputOptions.file) === '.mjs')) {
            const source = new MagicString(code);
            const program = parse(code);
            walk.simple(program, {
                ExpressionStatement(node) {
                    if (node.expression.type === 'Literal' &&
                        node.expression.value === 'use strict' &&
                        node.range) {
                        source.remove(node.range[0], node.range[1]);
                    }
                },
            });
            return {
                code: source.toString(),
                map: source.generateMap().mappings,
            };
        }
        return {
            code,
        };
    }
}

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
class ConstTransform extends Transform {
    /**
     * When outputting ES2017+ code there is neglagible differences between `const` and `let` for runtime performance.
     * So, we replace all usages of `const` with `let` to enable more variable folding.
     * @param code source following closure compiler minification
     * @return code after removing the strict mode declaration (when safe to do so)
     */
    async preCompilation(code) {
        const source = new MagicString(code);
        const program = parse(code);
        walk.simple(program, {
            VariableDeclaration(node) {
                if (node.kind === 'const' && node.range) {
                    source.overwrite(node.range[0], node.range[1], code.substring(node.range[0], node.range[1]).replace('const ', 'let '));
                }
            },
        });
        return {
            code: source.toString(),
            map: source.generateMap().mappings,
        };
    }
}

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
/**
 * Instantiate transform class instances for the plugin invocation.
 * @param context Plugin context to bind for each transform instance.
 * @param options Rollup input options
 * @return Instantiated transform class instances for the given entry point.
 */
const createTransforms = (context, options) => {
    return [
        new ConstTransform(context, options),
        new IifeTransform(context, options),
        new LiteralComputedKeys(context, options),
        new StrictTransform(context, options),
        new ExportTransform(context, options),
        new ImportTransform(context, options),
    ];
};
/**
 * Run each transform's `preCompilation` phase.
 * @param code source code to modify with `preCompilation` before Closure Compiler is given it.
 * @param outputOptions Rollup's configured output options
 * @param transforms Transforms to execute.
 * @return source code following `preCompilation`
 */
async function preCompilation(code, outputOptions, transforms) {
    for (const transform of transforms) {
        transform.outputOptions = outputOptions;
        const result = await transform.preCompilation(code);
        if (result && result.code) {
            code = result.code;
        }
    }
    return code;
}
/**
 * Run each transform's `postCompilation` phase.
 * @param code source code to modify with `postCompilation` after Closure Compiler has finished.
 * @param transforms Transforms to execute.
 * @return source code following `postCompilation`
 */
async function postCompilation(code, transforms) {
    for (const transform of transforms) {
        const result = await transform.postCompilation(code);
        if (result && result.code) {
            code = result.code;
        }
    }
    return code;
}

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
const { getNativeImagePath, getFirstSupportedPlatform, } = require('google-closure-compiler/lib/utils.js');
var Platform;
(function (Platform) {
    Platform["NATIVE"] = "native";
    Platform["JAVA"] = "java";
    Platform["JAVASCRIPT"] = "javascript";
})(Platform || (Platform = {}));
/**
 * Splits user `prefer` option from compiler options object
 * returns new object containing options and preferred platform.
 * @param {CompileOptions} content - compiler options object
 * @return {Object}
 * @example in rollup.config.js
 *  buble(),
 *  compiler({
 *    prefer: 'javascript',
 *  }),
 */
function filterContent(content) {
    let prefer = '';
    if ('prefer' in content) {
        prefer = content['prefer'];
        delete content.prefer;
    }
    const res = { config: content, prefer: prefer };
    return res;
}
/**
 * Finds prefered user platform precedence in list of defaults
 * and re-orders the list with prefered option first.
 * @param {Array} haystack - array of allowed platform strings
 * @param {String} needle - preferred platform string
 * @return {Array}
 */
function reOrder(haystack, needle) {
    const index = haystack.indexOf(needle);
    const precedent = haystack.splice(index, 1);
    return precedent.concat(haystack);
}
const PLATFORM_PRECEDENCE = [Platform.NATIVE, Platform.JAVA, Platform.JAVASCRIPT];
/**
 * Run Closure Compiler and `postCompilation` Transforms on input source.
 * @param compileOptions Closure Compiler CompileOptions, normally derived from Rollup configuration
 * @param transforms Transforms to run rollowing compilation
 * @return Promise<string> source following compilation and Transforms.
 */
function compiler$1 (compileOptions, transforms) {
    return new Promise((resolve$$1, reject) => {
        const options = filterContent(compileOptions);
        const { prefer, config } = options;
        const USER_PLATFORM_PRECEDENCE = (prefer !== '') ? reOrder(PLATFORM_PRECEDENCE, prefer) : PLATFORM_PRECEDENCE;
        const instance = new compiler(config);
        const firstSupportedPlatform = getFirstSupportedPlatform(USER_PLATFORM_PRECEDENCE);
        if (firstSupportedPlatform !== Platform.JAVA) {
            // TODO(KB): Provide feedback on this API. It's a little strange to nullify the JAR_PATH
            // and provide a fake java path.
            instance.JAR_PATH = null;
            instance.javaPath = getNativeImagePath();
        }
        instance.run(async (exitCode, code, stdErr) => {
            if ('warning_level' in compileOptions &&
                compileOptions.warning_level === 'VERBOSE' &&
                stdErr !== '') {
                reject(new Error(`Google Closure Compiler ${stdErr}`));
            }
            else if (exitCode !== 0) {
                reject(new Error(`Google Closure Compiler exit ${exitCode}: ${stdErr}`));
            }
            else {
                resolve$$1(await postCompilation(code, transforms));
            }
        });
    });
}

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
const readFile$1 = promisify(readFile);
/**
 * Transform the tree-shaken code from Rollup with Closure Compiler (with derived configuration and transforms)
 * @param compileOptions Closure Compiler compilation options from Rollup configuration.
 * @param transforms Transforms to apply to source followin Closure Compiler completion.
 * @param code Source to compile.
 * @param outputOptions Rollup Output Options.
 * @return Closure Compiled form of the Rollup Chunk
 */
const renderChunk = async (transforms, requestedCompileOptions = {}, sourceCode, outputOptions) => {
    const code = await preCompilation(sourceCode, outputOptions, transforms);
    const [compileOptions, mapFile] = options(requestedCompileOptions, outputOptions, code, transforms);
    return compiler$1(compileOptions, transforms).then(async (code) => {
        return { code, map: JSON.parse(await readFile$1(mapFile, 'utf8')) };
    }, (error) => {
        throw error;
    });
};
function closureCompiler(requestedCompileOptions = {}) {
    let inputOptions;
    let context;
    return {
        name: 'closure-compiler',
        options: options$$1 => (inputOptions = options$$1),
        buildStart() {
            context = this;
            if ('compilation_level' in requestedCompileOptions &&
                requestedCompileOptions.compilation_level === 'ADVANCED_OPTIMIZATIONS' &&
                inputOptions.experimentalCodeSplitting) {
                context.warn('Rollup experimentalCodeSplitting with Closure Compiler ADVANCED_OPTIMIZATIONS is not currently supported.');
            }
        },
        renderChunk: async (code, chunk, outputOptions) => {
            const transforms = createTransforms(context, inputOptions);
            return await renderChunk(transforms, requestedCompileOptions, code, outputOptions);
        },
    };
}

export default closureCompiler;