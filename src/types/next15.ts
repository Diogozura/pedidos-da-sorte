// src/types/next15.ts
export type AsyncPageProps<
  P extends Record<string, string> = Record<string, string>,
  S extends Record<string, string | string[] | undefined> = Record<string, string | string[] | undefined>
> = {
  params: Promise<P>;
  searchParams: Promise<S>;
};
