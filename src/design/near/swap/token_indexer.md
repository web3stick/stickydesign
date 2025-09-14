# Token Indexer

To try the API interactively, use the [Swagger UI](https://prices.intear.tech/swagger-ui/).

All endpoints require no authorization and are behind a short-term Cloudflare Cache to reduce the load, so you may experience up to 5 seconds of delay when accessing data that updates frequently.

To use it on testnet, replace the domain with `prices-testnet.intear.tech`, prices are bound to `usdtt.fakes.testnet`.

## Token Price

### Ref.finance Compatibility

For full compatibility with `indexer.ref.finance`, use these methods:

- `https://indexer.ref.finance/list-token-price` -> `https://prices.intear.tech/list-token-price`
- `https://indexer.ref.finance/get-token-price?token_id=intel.tkn.near` -> `https://prices.intear.tech/get-token-price?token_id=intel.tkn.near`

Other methods do not have a direct equivalent of the `indexer.ref.finance` API.

### Compact variant

For a more compact version that includes only a map of token IDs to prices, use the following methods:

- `https://prices.intear.tech/prices`
- `https://prices.intear.tech/price?token_id=intel.tkn.near`

### High Precision

For high precision prices, use the following methods:

- `https://prices.intear.tech/super-precise`
- `https://prices.intear.tech/super-precise-price?token_id=intel.tkn.near`

The prices are returned as strings, with 200+ decimal places.

### Hardcoded prices

Each of the methods above has a version for some hardcoded prices:

- `https://prices.intear.tech/hardcoded/list-token-price`
- `https://prices.intear.tech/hardcoded/get-token-price?token_id=intel.tkn.near`
- `https://prices.intear.tech/hardcoded/prices`
- `https://prices.intear.tech/hardcoded/price?token_id=intel.tkn.near`
- `https://prices.intear.tech/hardcoded/super-precise`
- `https://prices.intear.tech/hardcoded/super-precise-price?token_id=intel.tkn.near`

These prices have some special logic, such as stablecoins being pegged to 1 USD if they're close enough,
or some tokens being 0 because of a messed up liquidity pool and / or the token becoming non-transferrable.

## Full Token Info

These endpoints:

- `https://prices.intear.tech/tokens`
- `https://prices.intear.tech/token?token_id=intel.tkn.near`

return the full token info, including the token ID, symbol, name, decimals, liquidity pool with the most
liquidity, circulating and total supply, and more.

## Token Reputation

Intear maintains a list of tokens that are considered "Reputable", "NotFake", "Unknown" (default), or "Spam".

### Tokens by Reputation

To get a list of token IDs by reputation, use the following methods:

- `https://prices.intear.tech/token-spam-list`
- `https://prices.intear.tech/token-unknown-or-better-list`
- `https://prices.intear.tech/token-notfake-or-better-list`
- `https://prices.intear.tech/reputable-list`

To get the full data of these tokens, use the following methods:

- `https://prices.intear.tech/tokens-unknown-or-better`
- `https://prices.intear.tech/tokens-notfake-or-better`
- `https://prices.intear.tech/tokens-reputable`

## Token Search API

To search for tokens by name, symbol, ID, slugs, or even socials, use the following method:

- `https://prices.intear.tech/token-search?q=intear&n=5&rep=NotFake&acc=slimedragon.near`

Here, `q` is the query, `n` is the number of results to return, `rep` is the minimum reputation required, and `acc` is the user account.

`q` is a required parameter, while `n`, `rep`, and `acc` are optional, `n` defaults to `5` and `rep` defaults to `Unknown`.

The tokens are sorted based on:

- Relevance. Whether the query is an exact match of a contract ID, symbol, name, etc., a prefix
  of these, or a substring.
- Reputation. Tokens with higher reputation have the internal "score" boosted by a lot.
- Market Cap. Tokens with higher market cap have the internal "score" boosted by a bit.
- Owned tokens. Tokens owned by the user account have the internal "score" boosted by 20% if the user owned this token at least once, or 30% if the user currently owns this token (amount doesn't matter).

The full ranking code can be found [on GitHub](https://github.com/INTEARnear/price-indexer/tree/main/src/token.rs)
in `sorting_score` method.


