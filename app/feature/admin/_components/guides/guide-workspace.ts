import type { Guide } from "./guide-model";
import type { LocalGuide } from "./guide-storage";
import {
  createGuide,
  deleteGuide,
  getGuide,
  guideKeys,
  saveGuide,
  setGuidePublished,
} from "./guides-api";

/** The rich document editor is shared; each library supplies its own API and cache scope. */
export type GuideWorkspace = {
  kind: "admin" | "user";
  home: string;
  keys: {
    all: readonly unknown[];
    list: readonly unknown[];
    detail: (id: string) => readonly unknown[];
    published: readonly unknown[];
  };
  get: (id: string) => Promise<Guide>;
  create: (guide: Guide | LocalGuide) => Promise<Guide>;
  save: (guide: Guide) => Promise<Guide>;
  publish: (
    guide: Pick<Guide, "id" | "version">,
    published: boolean,
  ) => Promise<Guide>;
  delete: (guide: Pick<Guide, "id" | "version">) => Promise<void>;
};

export const adminGuideWorkspace: GuideWorkspace = {
  kind: "admin",
  home: "/admin/guides",
  keys: guideKeys,
  get: getGuide,
  create: createGuide,
  save: saveGuide,
  publish: setGuidePublished,
  delete: deleteGuide,
};
