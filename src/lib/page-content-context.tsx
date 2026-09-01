import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAllPageContent } from "./db";
import {
  buildCmsDictionary,
  emptyCmsStore,
  resolveCmsImage,
  type CmsPageDocument,
  type CmsPageId,
} from "./page-content";
import type { PhotoName } from "../components/photo";
import type { Dictionary } from "./copy";
import type { Lang } from "./page-content";

type PageContentContextValue = {
  ready: boolean;
  store: Record<CmsPageId, CmsPageDocument>;
  refresh: () => Promise<void>;
  dictionary: (lang: Lang) => Dictionary;
  image: (pageId: CmsPageId, key: string, fallback: PhotoName) => PhotoName;
};

const PageContentContext = createContext<PageContentContextValue | null>(null);

export function PageContentProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Record<CmsPageId, CmsPageDocument>>(emptyCmsStore);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const next = await getAllPageContent();
      setStore(next);
    } catch {
      setStore(emptyCmsStore());
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const dictionary = useCallback((lang: Lang) => buildCmsDictionary(lang, store), [store]);

  const image = useCallback(
    (pageId: CmsPageId, key: string, fallback: PhotoName) => resolveCmsImage(store, pageId, key, fallback),
    [store],
  );

  const value = useMemo(
    () => ({ ready, store, refresh, dictionary, image }),
    [ready, store, refresh, dictionary, image],
  );

  return <PageContentContext.Provider value={value}>{children}</PageContentContext.Provider>;
}

export function usePageContent() {
  const ctx = useContext(PageContentContext);
  if (!ctx) throw new Error("usePageContent must be used within PageContentProvider");
  return ctx;
}

export function useCmsImage(pageId: CmsPageId, key: string, fallback: PhotoName) {
  const { image } = usePageContent();
  return image(pageId, key, fallback);
}
