/**
 * Utility functions for handling ComfyUI workflow JSON strings containing placeholders
 * such as {{positive_prompt}}, {{negative_prompt}}, {{image_width}}, {{image_height}}, {{steps}}, etc.
 */

// Known numeric placeholders that should be replaced with valid numbers when validating JSON syntax
const NUMERIC_PLACEHOLDER_REGEX = /^(image_)?(width|height|steps|seed|cfg|cfg_scale|denoise|batch_size|shift|megapixels|resolution_steps|scale|strength|num_frames|fps|fidelity)$/i;

/**
 * Replaces unquoted and quoted placeholders with mock valid JSON values
 * so that JSON.parse() can safely validate the structural syntax without failing on {{...}} or ${...}.
 */
export function sanitizeWorkflowJsonForValidation(jsonStr: string): string {
  if (!jsonStr || !jsonStr.trim()) return '';

  let sanitized = jsonStr;

  // 1. Handle unquoted placeholders that appear after colons, commas, or opening brackets:
  // e.g.: "width": {{image_width}},  or  "steps": ${steps},  or  [ {{image_width}}, 0 ]
  sanitized = sanitized.replace(
    /(:\s*|\[\s*|,\s*)(?:\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}|\$\{\s*([a-zA-Z0-9_-]+)\s*\})/g,
    (match, prefix, phName1, phName2) => {
      const phName = (phName1 || phName2 || '').toLowerCase();
      if (NUMERIC_PLACEHOLDER_REGEX.test(phName)) {
        // Safe numerical dummy value
        if (phName.includes('width') || phName.includes('height')) return `${prefix}1024`;
        if (phName.includes('steps')) return `${prefix}20`;
        if (phName.includes('cfg')) return `${prefix}1.8`;
        if (phName.includes('seed')) return `${prefix}42`;
        if (phName.includes('denoise')) return `${prefix}1.0`;
        if (phName.includes('batch')) return `${prefix}1`;
        return `${prefix}1`;
      }
      // For non-numeric unquoted placeholders, replace with a dummy string
      return `${prefix}"__PLACEHOLDER_MOCK_${phName}__"`;
    }
  );

  return sanitized;
}

/**
 * Extracts all unique placeholder names from a workflow JSON string.
 */
export function extractPlaceholdersFromWorkflowJson(jsonStr: string): string[] {
  if (!jsonStr) return [];
  const found = new Set<string>();
  const regex = /(?:\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}|\$\{\s*([a-zA-Z0-9_-]+)\s*\})/g;
  let match;
  while ((match = regex.exec(jsonStr)) !== null) {
    const name = match[1] || match[2];
    if (name) found.add(name);
  }
  return Array.from(found);
}

/**
 * Formats a workflow JSON string with 2 spaces indentation
 * while safely preserving all placeholders (both quoted and unquoted).
 */
export function formatWorkflowJsonWithPlaceholders(jsonStr: string): string {
  if (!jsonStr || !jsonStr.trim()) return '';

  try {
    // Replace unquoted placeholders with a temporary safe token
    const tokenMap = new Map<string, string>();
    let counter = 0;

    const tokenized = jsonStr.replace(
      /(:\s*|\[\s*|,\s*)(?:\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}|\$\{\s*([a-zA-Z0-9_-]+)\s*\})/g,
      (match, prefix, phName1, phName2) => {
        const phName = phName1 || phName2;
        const token = 99990000 + counter++;
        tokenMap.set(String(token), `{{${phName}}}`);
        return `${prefix}${token}`;
      }
    );

    const parsed = JSON.parse(tokenized);
    let formatted = JSON.stringify(parsed, null, 2);

    // Restore tokens
    tokenMap.forEach((originalPlaceholder, token) => {
      // Replace token with original placeholder
      formatted = formatted.replace(new RegExp(`(:\\s*|\\[\\s*|,\\s*)${token}\\b`, 'g'), `$1${originalPlaceholder}`);
    });

    return formatted;
  } catch {
    // If parsing fails, return original
    return jsonStr;
  }
}

/**
 * Safely resolves and substitutes user parameters into a workflow JSON string,
 * producing a fully valid ComfyUI API Prompt graph ready to send to ComfyUI.
 */
export function resolveWorkflowJsonTemplate(
  rawJsonStr: string,
  vars: Record<string, any>
): Record<string, any> {
  if (!rawJsonStr || !rawJsonStr.trim()) {
    throw new Error('工作流 JSON 模版为空');
  }

  let text = rawJsonStr;

  // 1. Process unquoted placeholders first:
  // e.g.: "width": {{image_width}},  or  "steps": ${steps},
  text = text.replace(
    /(:\s*|\[\s*|,\s*)(?:\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}|\$\{\s*([a-zA-Z0-9_-]+)\s*\})/g,
    (match, prefix, ph1, ph2) => {
      const key = ph1 || ph2;
      const lowerKey = key.toLowerCase();
      
      // Look up in variables
      let val = vars[key] ?? vars[lowerKey];
      if (val === undefined) {
        if (lowerKey === 'image_width' || lowerKey === 'width') val = vars.width || vars.image_width || 1024;
        else if (lowerKey === 'image_height' || lowerKey === 'height') val = vars.height || vars.image_height || 1024;
        else if (lowerKey === 'positive_prompt' || lowerKey === 'prompt') val = vars.positive_prompt || vars.positivePrompt || '';
        else if (lowerKey === 'negative_prompt') val = vars.negative_prompt || vars.negativePrompt || '';
        else if (lowerKey === 'cfg' || lowerKey === 'cfg_scale') val = vars.cfg || vars.cfg_scale || 1.8;
        else if (lowerKey === 'steps') val = vars.steps || 20;
        else if (lowerKey === 'seed') val = vars.seed || 42;
        else if (lowerKey === 'denoise') val = vars.denoise ?? 1.0;
        else if (lowerKey === 'batch_size') val = vars.batch_size || 1;
        else if (lowerKey === 'filename_prefix') val = vars.filename_prefix || 'PromptManager';
        else val = '';
      }

      if (typeof val === 'number' || typeof val === 'boolean') {
        return `${prefix}${val}`;
      } else {
        return `${prefix}${JSON.stringify(String(val))}`;
      }
    }
  );

  // 2. Process quoted placeholders:
  // e.g.: "text": "{{positive_prompt}}",  or  "filename_prefix": "{{filename_prefix}}"
  for (const [k, rawVal] of Object.entries(vars)) {
    const stringVal = typeof rawVal === 'string' ? rawVal : String(rawVal);
    // Escape string content for inclusion in JSON string literal (strip outside quotes from JSON.stringify)
    const jsonEscaped = JSON.stringify(stringVal).slice(1, -1);

    const regex1 = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g');
    const regex2 = new RegExp(`\\$\\{\\s*${k}\\s*\\}`, 'g');
    text = text.replace(regex1, jsonEscaped).replace(regex2, jsonEscaped);
  }

  // Handle case-insensitive fallback placeholders like {{image_width}}, {{positive_prompt}}
  const commonFallbacks: Record<string, string> = {
    positive_prompt: typeof vars.positive_prompt === 'string' ? vars.positive_prompt : (vars.positivePrompt || ''),
    negative_prompt: typeof vars.negative_prompt === 'string' ? vars.negative_prompt : (vars.negativePrompt || ''),
    image_width: String(vars.image_width || vars.width || 1024),
    image_height: String(vars.image_height || vars.height || 1024),
    width: String(vars.width || vars.image_width || 1024),
    height: String(vars.height || vars.image_height || 1024),
    steps: String(vars.steps || 20),
    cfg: String(vars.cfg || vars.cfg_scale || 1.8),
    cfg_scale: String(vars.cfg_scale || vars.cfg || 1.8),
    sampler_name: String(vars.sampler_name || vars.sampler || 'euler'),
    scheduler: String(vars.scheduler || 'simple'),
    seed: String(vars.seed || 42),
    filename_prefix: String(vars.filename_prefix || 'PromptManager'),
  };

  for (const [k, strVal] of Object.entries(commonFallbacks)) {
    const jsonEscaped = JSON.stringify(strVal).slice(1, -1);
    const regex1 = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'gi');
    const regex2 = new RegExp(`\\$\\{\\s*${k}\\s*\\}`, 'gi');
    text = text.replace(regex1, jsonEscaped).replace(regex2, jsonEscaped);
  }

  // 3. Parse JSON string into ComfyUI graph object
  let parsedGraph: Record<string, any>;
  try {
    parsedGraph = JSON.parse(text);
  } catch (err: any) {
    // If strict text replacement left any unquoted syntax issue, fallback to sanitized parsing + deep object replacement
    const sanitized = sanitizeWorkflowJsonForValidation(rawJsonStr);
    parsedGraph = JSON.parse(sanitized);
    parsedGraph = deepReplaceGraphValues(parsedGraph, vars);
  }

  return parsedGraph;
}

/**
 * Deep recursive replacement in parsed object
 */
function deepReplaceGraphValues(obj: any, vars: Record<string, any>): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    let text = obj;
    for (const [k, v] of Object.entries(vars)) {
      const regex1 = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'gi');
      const regex2 = new RegExp(`\\$\\{\\s*${k}\\s*\\}`, 'gi');
      if (text === `{{${k}}}` || text === `\${${k}}`) {
        return v;
      }
      text = text.replace(regex1, String(v)).replace(regex2, String(v));
    }
    return text;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepReplaceGraphValues(item, vars));
  }

  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = deepReplaceGraphValues(v, vars);
    }
    return result;
  }

  return obj;
}
