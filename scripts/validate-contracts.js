import fs from 'fs';

function parseOpenApiContracts(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const pathRe = /^  (\/api\/v1[^:]*):\s*$/;
  const methodRe = /^    (get|post|put|patch|delete):\s*$/i;
  const results = new Set();
  let currentPath = '';

  for (const line of lines) {
    const pathMatch = line.match(pathRe);
    if (pathMatch) {
      currentPath = pathMatch[1];
      continue;
    }

    const methodMatch = line.match(methodRe);
    if (methodMatch && currentPath) {
      results.add(`${methodMatch[1].toUpperCase()} ${currentPath}`);
    }
  }

  return results;
}

function parseMappingCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const results = new Set();
  const requiredCols = ['api_method', 'api_path'];

  if (!lines.length) {
    return results;
  }

  const header = lines[0].split(',').map((item) => item.trim().replace(/^"|"$/g, ''));
  const methodIdx = header.indexOf('api_method');
  const pathIdx = header.indexOf('api_path');

  if (methodIdx === -1 || pathIdx === -1) {
    throw new Error('ui-control-api-field-map.csv must include api_method and api_path columns');
  }

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) {
      continue;
    }

    const parts = line.split(',').map((item) => item.trim().replace(/^"|"$/g, ''));
    const method = (parts[methodIdx] || '').toUpperCase();
    const apiPath = (parts[pathIdx] || '').trim();
    if (!method || !apiPath) {
      continue;
    }
    results.add(`${method} ${apiPath}`);
  }

  return results;
}

function main() {
  const openapiContracts = parseOpenApiContracts('docs/openapi-v4.1.yaml');
  const uiMappings = parseMappingCsv('docs/ui-control-api-field-map.csv');

  const missingInMap = Array.from(openapiContracts).filter((item) => !uiMappings.has(item));

  if (missingInMap.length) {
    console.error('[validate:contracts] missing UI mapping for API contracts:');
    for (const item of missingInMap.sort()) {
      console.error(`  - ${item}`);
    }
    process.exit(1);
  }

  const missingOpenApi = Array.from(uiMappings).filter((item) => !openapiContracts.has(item));
  if (missingOpenApi.length) {
    console.warn('[validate:contracts] UI mappings point to endpoints not in openapi (ignored for now):');
    for (const item of missingOpenApi.sort()) {
      console.warn(`  - ${item}`);
    }
  }

  console.log(`[validate:contracts] checked ${openapiContracts.size} contracts, ${uiMappings.size} mappings, all contract-covered entries found.`);
}

try {
  main();
} catch (error) {
  console.error('[validate:contracts] failed:', error.message);
  process.exit(1);
}
