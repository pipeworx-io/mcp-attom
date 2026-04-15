interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * ATTOM MCP — Premium real estate data from ATTOM Data Solutions
 *
 * BYO key: requires an ATTOM API key from https://api.gateway.attomdata.com
 * Passed via _apiKey parameter.
 *
 * Tools:
 * - attom_property_detail: get full property characteristics by address
 * - attom_property_search: search properties by location with filters
 * - attom_sales_history: get complete sales history for a property
 * - attom_avm: get automated valuation (AVM) for a property
 * - attom_assessment: get property tax assessment details
 * - attom_sales_trend: get market sales trends by ZIP
 * - attom_rental_avm: get rental property AVM
 * - attom_school_search: search schools near a location
 */


// ── Helpers ────────────────────────────────────────────────────────────

function extractKey(args: Record<string, unknown>): string {
  const key = args._apiKey as string;
  delete args._apiKey;
  if (!key) throw new Error('ATTOM API key required. Get one at https://api.gateway.attomdata.com and pass via _apiKey.');
  return key;
}

async function attomGet(apiKey: string, path: string, params: Record<string, string> = {}) {
  const url = new URL(`https://api.gateway.attomdata.com/propertyapi/v1.0.0${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { accept: 'application/json', apikey: apiKey },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ATTOM API error (${res.status}): ${text}`);
  }
  return res.json();
}

// ── Tool definitions ───────────────────────────────────────────────────

const tools: McpToolExport['tools'] = [
  {
    name: 'attom_property_detail',
    description:
      'Get full property characteristics by address — lot size, square footage, bedrooms, bathrooms, year built, construction type, heating/cooling, and more.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        address1: { type: 'string', description: 'Street address (e.g., "123 Main St")' },
        address2: { type: 'string', description: 'City, state ZIP (e.g., "Denver, CO 80202")' },
        _apiKey: { type: 'string', description: 'ATTOM API key' },
      },
      required: ['address1', 'address2', '_apiKey'],
    },
  },
  {
    name: 'attom_property_search',
    description:
      'Search properties by location with optional filters. Search by postal code or by latitude/longitude with a radius.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        postalCode: { type: 'string', description: 'ZIP/postal code to search in' },
        latitude: { type: 'string', description: 'Latitude for radius search (use with longitude and radius)' },
        longitude: { type: 'string', description: 'Longitude for radius search (use with latitude and radius)' },
        radius: { type: 'string', description: 'Search radius in miles (use with latitude/longitude)' },
        propertyType: { type: 'string', description: 'Property type filter (e.g., "SFR", "CONDO", "APARTMENT")' },
        minBeds: { type: 'string', description: 'Minimum number of bedrooms' },
        maxBeds: { type: 'string', description: 'Maximum number of bedrooms' },
        minBathsTotal: { type: 'string', description: 'Minimum total bathrooms' },
        maxBathsTotal: { type: 'string', description: 'Maximum total bathrooms' },
        minYearBuilt: { type: 'string', description: 'Minimum year built' },
        maxYearBuilt: { type: 'string', description: 'Maximum year built' },
        _apiKey: { type: 'string', description: 'ATTOM API key' },
      },
      required: ['_apiKey'],
    },
  },
  {
    name: 'attom_sales_history',
    description:
      'Get complete sales history for a property (up to 10 years) — sale dates, prices, deed types, seller/buyer info.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        address1: { type: 'string', description: 'Street address (e.g., "123 Main St")' },
        address2: { type: 'string', description: 'City, state ZIP (e.g., "Denver, CO 80202")' },
        _apiKey: { type: 'string', description: 'ATTOM API key' },
      },
      required: ['address1', 'address2', '_apiKey'],
    },
  },
  {
    name: 'attom_avm',
    description:
      'Get automated valuation (AVM) for a property — estimated market value, confidence score, value range (low/high).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        address1: { type: 'string', description: 'Street address (e.g., "123 Main St")' },
        address2: { type: 'string', description: 'City, state ZIP (e.g., "Denver, CO 80202")' },
        _apiKey: { type: 'string', description: 'ATTOM API key' },
      },
      required: ['address1', 'address2', '_apiKey'],
    },
  },
  {
    name: 'attom_assessment',
    description:
      'Get property tax assessment details — assessed value, market value, tax amount, tax year, and assessment history.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        address1: { type: 'string', description: 'Street address (e.g., "123 Main St")' },
        address2: { type: 'string', description: 'City, state ZIP (e.g., "Denver, CO 80202")' },
        _apiKey: { type: 'string', description: 'ATTOM API key' },
      },
      required: ['address1', 'address2', '_apiKey'],
    },
  },
  {
    name: 'attom_sales_trend',
    description:
      'Get market sales trends by ZIP code — average/median sale price, volume, and price changes over time.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        geoid: { type: 'string', description: 'ZIP code prefixed with "ZI" (e.g., "ZI80202")' },
        interval: { type: 'string', description: 'Time interval: monthly, quarterly, or yearly' },
        startYear: { type: 'string', description: 'Start year (e.g., "2020")' },
        endYear: { type: 'string', description: 'End year (e.g., "2024")' },
        _apiKey: { type: 'string', description: 'ATTOM API key' },
      },
      required: ['geoid', 'interval', 'startYear', 'endYear', '_apiKey'],
    },
  },
  {
    name: 'attom_rental_avm',
    description:
      'Get rental property AVM — estimated monthly rent, rental yield, and rental value range.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        address1: { type: 'string', description: 'Street address (e.g., "123 Main St")' },
        address2: { type: 'string', description: 'City, state ZIP (e.g., "Denver, CO 80202")' },
        _apiKey: { type: 'string', description: 'ATTOM API key' },
      },
      required: ['address1', 'address2', '_apiKey'],
    },
  },
  {
    name: 'attom_school_search',
    description:
      'Search schools near a location — name, type (public/private), grades, distance, and rankings.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        latitude: { type: 'string', description: 'Latitude of the search center' },
        longitude: { type: 'string', description: 'Longitude of the search center' },
        radius: { type: 'string', description: 'Search radius in miles (default 5, max 20)' },
        _apiKey: { type: 'string', description: 'ATTOM API key' },
      },
      required: ['latitude', 'longitude', '_apiKey'],
    },
  },
];

// ── callTool dispatcher ────────────────────────────────────────────────

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const key = extractKey(args);

  switch (name) {
    case 'attom_property_detail':
      return attomGet(key, '/property/detail', {
        address1: args.address1 as string,
        address2: args.address2 as string,
      });

    case 'attom_property_search': {
      const params: Record<string, string> = {};
      if (args.postalCode) params.postalCode = args.postalCode as string;
      if (args.latitude) params.latitude = args.latitude as string;
      if (args.longitude) params.longitude = args.longitude as string;
      if (args.radius) params.radius = args.radius as string;
      if (args.propertyType) params.propertytype = args.propertyType as string;
      if (args.minBeds) params.minBeds = args.minBeds as string;
      if (args.maxBeds) params.maxBeds = args.maxBeds as string;
      if (args.minBathsTotal) params.minBathsTotal = args.minBathsTotal as string;
      if (args.maxBathsTotal) params.maxBathsTotal = args.maxBathsTotal as string;
      if (args.minYearBuilt) params.minYearBuilt = args.minYearBuilt as string;
      if (args.maxYearBuilt) params.maxYearBuilt = args.maxYearBuilt as string;

      if (!params.postalCode && !params.latitude) {
        throw new Error('Either postalCode or latitude+longitude is required for property search.');
      }
      return attomGet(key, '/property/snapshot', params);
    }

    case 'attom_sales_history':
      return attomGet(key, '/saleshistory/expandedhistory', {
        address1: args.address1 as string,
        address2: args.address2 as string,
      });

    case 'attom_avm':
      return attomGet(key, '/attomavm/detail', {
        address1: args.address1 as string,
        address2: args.address2 as string,
      });

    case 'attom_assessment':
      return attomGet(key, '/assessment/detail', {
        address1: args.address1 as string,
        address2: args.address2 as string,
      });

    case 'attom_sales_trend':
      return attomGet(key, '/salestrend/snapshot', {
        geoid: args.geoid as string,
        interval: args.interval as string,
        startyear: args.startYear as string,
        endyear: args.endYear as string,
      });

    case 'attom_rental_avm':
      return attomGet(key, '/valuation/rentalavm', {
        address1: args.address1 as string,
        address2: args.address2 as string,
      });

    case 'attom_school_search': {
      const radius = (args.radius as string) ?? '5';
      return attomGet(key, '/school/search', {
        latitude: args.latitude as string,
        longitude: args.longitude as string,
        radius,
      });
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool, meter: { credits: 15 } } satisfies McpToolExport;
