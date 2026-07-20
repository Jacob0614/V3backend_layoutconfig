import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    parentTitle?: string;
    roles?: Array<'admin' | 'tenant'>;
    group?: string;
    keepAlive?: boolean;
    isNew?: boolean;
    hidden?: boolean;
  }
}

export {};
