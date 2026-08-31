import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';

const repositoryRoot = resolve(import.meta.dirname, '..');
const sourceRoot = join(repositoryRoot, 'src');
const methodsRoot = join(sourceRoot, 'methods');
const trigonometryRoot = join(methodsRoot, 'trigonometry');
const decimalFacade = join(sourceRoot, 'Decimal.ts');
const violations = [];
const trigonometricOperations = new Set([
	'acos', 'acosh', 'asin', 'asinh', 'atan', 'atan2', 'atanh',
	'cos', 'cosh', 'sin', 'sinh', 'tan', 'tanh'
]);

for (const file of walkTypeScriptFiles(methodsRoot))
{
	const source = ts.createSourceFile(
		file,
		readFileSync(file, 'utf8'),
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS
	);

	for (const statement of source.statements)
	{
		if (ts.isImportDeclaration(statement))
		{
			if (
				resolveImport(file, statement.moduleSpecifier.text) === decimalFacade &&
				hasRuntimeBinding(statement.importClause)
			) {
				violations.push(`${relative(repositoryRoot, file)} runtime-imports Decimal`);
			}

			continue;
		}

		if (
			dirname(file) === trigonometryRoot &&
			ts.isFunctionDeclaration(statement) &&
			statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword) &&
			statement.name &&
			trigonometricOperations.has(statement.name.text)
		) {
			const moduleName = basename(file, '.ts');

			if (statement.name.text !== moduleName)
			{
				violations.push(
					`${relative(repositoryRoot, file)} exports ${statement.name.text}; public trigonometric operations require focused modules`
				);
			}
		}
	}
}

if (violations.length)
{
	throw new Error(
		'Architecture boundary violations:\n' +
		violations.map(file => '  - ' + file).join('\n')
	);
}

console.log(
	'Architecture boundary check passed: kernels use Decimal as a type only and trigonometric operations have focused modules.'
);

function walkTypeScriptFiles(directory)
{
	const files = [];

	for (const entry of readdirSync(directory, { withFileTypes: true }))
	{
		const path = join(directory, entry.name);

		if (entry.isDirectory())
		{
			files.push(...walkTypeScriptFiles(path));
		}
		else if (entry.name.endsWith('.ts'))
		{
			files.push(path);
		}
	}

	return files;
}

function resolveImport(importer, specifier)
{
	if (!specifier.startsWith('.')) return undefined;
	return resolve(dirname(importer), specifier.replace(/\.js$/, '.ts'));
}

function hasRuntimeBinding(clause)
{
	if (!clause) return true;
	if (clause.isTypeOnly) return false;
	if (clause.name) return true;
	if (!clause.namedBindings) return true;
	if (ts.isNamespaceImport(clause.namedBindings)) return true;

	return clause.namedBindings.elements.some(element => !element.isTypeOnly);
}
