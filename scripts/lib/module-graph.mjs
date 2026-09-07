import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

export function parseModule(file, text, resolveSpecifier)
{
	const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
	const edges = [];
	const bindings = new Map();
	const parents = new Map();
	const exportedFunctions = [];
	const problems = [];
	function edge(specifier, runtime)
	{
		if (!specifier || !ts.isStringLiteralLike(specifier))
		{
			problems.push(`${file}: module dependencies must use literal specifiers`);
			return;
		}
		const target = resolveSpecifier(file, specifier.text);
		if (!target) problems.push(`${file}: unresolved source dependency ${specifier.text}`);
		else edges.push({ target, runtime });
		return target;
	}
	function visit(node)
	{
		if (ts.isImportDeclaration(node))
		{
			const clause = node.importClause;
			const named = clause?.namedBindings;
			// With verbatimModuleSyntax, even import { type X } emits import {}.
			const runtime = !clause?.isTypeOnly;
			const target = edge(node.moduleSpecifier, runtime);
			if (clause?.name) bindings.set(clause.name.text, target);
			if (named && ts.isNamespaceImport(named)) bindings.set(named.name.text, target);
			else if (named) for (const item of named.elements) bindings.set(item.name.text, target);
		}
		else if (ts.isExportDeclaration(node) && node.moduleSpecifier)
		{
			edge(node.moduleSpecifier, !node.isTypeOnly);
		}
		else if (ts.isImportTypeNode(node)) edge(ts.isLiteralTypeNode(node.argument) ? node.argument.literal : undefined, false);
		else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
			ts.isIdentifier(node.expression) && node.expression.text === 'require')) edge(node.arguments[0], true);
		else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference))
			edge(node.moduleReference.expression, !node.isTypeOnly);
		if (ts.isClassDeclaration(node) && node.name)
		{
			const base = node.heritageClauses?.find(item => item.token === ts.SyntaxKind.ExtendsKeyword)?.types[0]?.expression;
			parents.set(node.name.text, base && (ts.isIdentifier(base) ? base.text : ts.isPropertyAccessExpression(base) ? base.expression.getText(source) : undefined));
		}
		if (ts.isFunctionDeclaration(node) && node.name && node.modifiers?.some(item => item.kind === ts.SyntaxKind.ExportKeyword))
			exportedFunctions.push(node.name.text);
		ts.forEachChild(node, visit);
	}
	visit(source);
	return { edges, parents: new Map([...parents].map(([name, base]) => [name, bindings.get(base)])), exportedFunctions, problems };
}

export function buildSourceGraph(root)
{
	const files = [];
	function walk(directory)
	{
		for (const entry of readdirSync(directory, { withFileTypes: true }))
		{
			const file = join(directory, entry.name);
			if (entry.isDirectory() && entry.name !== 'specs') walk(file);
			else if (entry.isFile() && entry.name.endsWith('.ts')) files.push(file);
		}
	}
	walk(join(root, 'src'));
	const normalize = file => relative(root, file).replaceAll('\\', '/');
	const sourceFiles = new Set(files.map(normalize));
	const config = ts.readConfigFile(join(root, 'tsconfig.json'), ts.sys.readFile);
	if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
	const { options } = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
	if (!options.verbatimModuleSyntax) throw new Error('Architecture graph requires verbatimModuleSyntax to classify emitted imports reliably');
	return new Map(files.map(file => {
		const name = normalize(file);
		return [name, parseModule(name, readFileSync(file, 'utf8'), (importer, specifier) => {
			const resolved = ts.resolveModuleName(specifier, resolve(root, importer), options, ts.sys).resolvedModule;
			const target = resolved && normalize(resolved.resolvedFileName);
			return sourceFiles.has(target) ? target : undefined;
		})];
	}));
}

/** Shortest dependency path, useful for actionable transitive boundary diagnostics. */
export function findDependencyPath(graph, start, forbidden, runtimeOnly = false)
{
	const queue = [[start]];
	const seen = new Set([start]);
	for (let index = 0; index < queue.length; index++)
	{
		const path = queue[index];
		for (const edge of graph.get(path.at(-1))?.edges ?? [])
		{
			if (runtimeOnly && !edge.runtime) continue;
			const next = [...path, edge.target];
			if (forbidden(edge.target)) return next;
			if (!seen.has(edge.target)) { seen.add(edge.target); queue.push(next); }
		}
	}
	return undefined;
}

export function runtimeCycles(graph)
{
	const complete = new Set();
	const active = new Set();
	const stack = [];
	const cycles = [];
	function visit(file)
	{
		if (active.has(file)) { cycles.push([...stack.slice(stack.indexOf(file)), file]); return; }
		if (complete.has(file)) return;
		active.add(file); stack.push(file);
		for (const edge of graph.get(file)?.edges ?? []) if (edge.runtime) visit(edge.target);
		stack.pop(); active.delete(file); complete.add(file);
	}
	for (const file of graph.keys()) visit(file);
	return cycles;
}
