type MockEnvelope<T> = {
  code: number;
  result: boolean;
  data: T;
  msg: string;
};

const emptyEnvelope = <T>(data: T): MockEnvelope<T> => ({
  code: 0,
  result: true,
  data,
  msg: 'success',
});

// V3 全域 API 邊界：原型只提供本地 stub，不發送真實 HTTP。
type MockNamespace = Record<string, (...args: any[]) => Promise<MockEnvelope<unknown>>>;

export const api = new Proxy<Record<string, MockNamespace>>(
  {} as Record<string, MockNamespace>,
  {
    get(_target: Record<string, MockNamespace>, _namespace: string): MockNamespace {
      return new Proxy({} as MockNamespace, {
        get(_namespaceTarget: MockNamespace, _method: string) {
          return async () => emptyEnvelope(null);
        },
      });
    },
  },
);

export const http: any = new Proxy({}, {
  get() {
    return async () => emptyEnvelope(null);
  },
});
