// Minimal chainable mock for the Supabase query builder, used to unit-test
// api/*.ts functions without a real database. Each call to `.from(...)` consumes
// the next entry from a queue (in the exact order the source code issues its
// queries) and returns a fresh chainable builder that resolves to it, however
// the chain is terminated (`.single()`, or awaiting the chain directly).

export interface MockQueryResult {
  data?: any;
  error?: any;
  reject?: any; // if set, the query rejects with this instead of resolving
}

const CHAIN_METHODS = ["select", "eq", "order", "range", "in", "update", "insert", "upsert", "delete"];

function makeChainableBuilder(config: MockQueryResult) {
  const settle = () =>
    config.reject
      ? Promise.reject(config.reject)
      : Promise.resolve({ data: config.data ?? null, error: config.error ?? null });

  const builder: any = {};
  for (const method of CHAIN_METHODS) {
    builder[method] = jest.fn(() => builder);
  }
  builder.single = jest.fn(() => settle());
  builder.then = (onFulfilled: any, onRejected: any) => settle().then(onFulfilled, onRejected);
  builder.catch = (onRejected: any) => settle().catch(onRejected);
  return builder;
}

// Wires `supabaseMock.from` to return queued results in call order, and returns
// the builders (also in call order) so tests can assert what each chained call
// was invoked with, e.g. `builders[1].update` for the second `.from()` call.
export function queueSupabaseFromResponses(
  supabaseMock: { from: jest.Mock; rpc?: jest.Mock },
  queue: MockQueryResult[],
) {
  const remaining = [...queue];
  const builders: any[] = [];
  supabaseMock.from.mockImplementation(() => {
    const config = remaining.shift() ?? { data: null, error: null };
    const builder = makeChainableBuilder(config);
    builders.push(builder);
    return builder;
  });
  if (supabaseMock.rpc) {
    supabaseMock.rpc.mockImplementation(() => Promise.resolve({ data: null, error: null }));
  }
  return builders;
}

// Same idea as queueSupabaseFromResponses but for `supabase.rpc(...)` calls —
// each call consumes the next queued result, in call order, so tests can mix
// RPC calls with `.from()` chains and assert on `rpc.mock.calls`.
export function queueSupabaseRpcResponses(
  supabaseMock: { rpc: jest.Mock },
  queue: MockQueryResult[],
) {
  const remaining = [...queue];
  supabaseMock.rpc.mockImplementation(() => {
    const config = remaining.shift() ?? { data: null, error: null };
    return config.reject
      ? Promise.reject(config.reject)
      : Promise.resolve({ data: config.data ?? null, error: config.error ?? null });
  });
}
