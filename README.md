# ATTOM — Property and Real Estate Data

ATTOM (formerly Onboard) is a commercial property data provider covering 99% of US single- and multi-family parcels. The data behind tax records, valuations (AVMs), comparables, ownership history, neighborhood demographics, and risk overlays (flood, wildfire). It's what most real-estate analytics products sit on top of.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Why this matters for AI agents

Anything about a specific US property — its value, taxes, sale history, who owns it, what it sold for last — flows from ATTOM. Commercial-grade data with national coverage; competing public sources (Zillow public data, county assessor sites) have spotty coverage and inconsistent schemas.

Common use cases:

- **AVM lookup.** "What's 123 Main St worth?" → `attom_avm({address1, address2})` → automated valuation with confidence band.
- **Tax history.** "What's the property tax been?" → `attom_tax_history` → annual tax assessments.
- **Comps.** "What have similar homes sold for nearby?" → `attom_comps`.
- **Market context.** "What's typical for this metro?" → `attom_market_stats`.

For a one-call combined view, use the [Housing Vertical](/docs/concepts/verticals)'s `housing_property_report` compound — wraps ATTOM AVM + tax + Altos market + FEMA flood.

## Auth

ATTOM is a paid commercial API. Two options:

1. **BYO key**: get an ATTOM key directly at https://api.developer.attomdata.com, pass via `_apiKey`:

   ```js
   attom_avm({
     address1: "123 Main St",
     address2: "Denver, CO 80202",
     _apiKey: "your-attom-api-key"
   })
   ```

2. **Pipeworx Housing Vertical**: subscribe at [pipeworx.io/account](https://pipeworx.io/account) and Pipeworx fronts the ATTOM relationship. No `_apiKey` needed; calls bill against your Pipeworx account.

The vertical option is simpler if you're using ATTOM alongside FRED, BLS, Altos, and FEMA — they're all packaged.

## Coverage and freshness

- **Coverage**: ~155M residential parcels, plus commercial records in major metros. National.
- **Update cadence**: County assessor data updates as counties update their records (varies — most update annually, some more often). AVMs recalibrate monthly. ATTOM is the lag, not Pipeworx.
- **Address normalization**: ATTOM is finicky about addresses. Use `address1` for the street part and `address2` for "City, ST ZIP" — works most consistently. Apartment numbers, abbreviations, and PO boxes all behave subtly differently.

## Common pitfalls

- **AVM bands matter.** A point estimate without the confidence band is misleading. Always report both. ATTOM gives you `valueLow` / `valueHigh` — pass both through to the user.
- **Tax history isn't always current-year.** Counties report at different cadences. The most-recent year in `attom_tax_history` may be 6–18 months behind reality.
- **Comps need filters.** Default `attom_comps` returns recent sales near the address but doesn't filter by similarity. Filter client-side by sqft, beds, baths, and date range to make comps useful.
- **Commercial vs. residential.** Most ATTOM tools default to residential. Commercial properties have different schemas; use the dedicated commercial endpoints (or the Housing Vertical's compound, which handles both).
- **Rural and tribal land.** Coverage gaps exist for some rural counties and tribal lands. If a valid-looking address returns no match, the parcel may not be in ATTOM's coverage.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "attom": {
      "url": "https://gateway.pipeworx.io/attom/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/attom/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Attom data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
