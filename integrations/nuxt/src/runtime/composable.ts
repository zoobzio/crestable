import type { AppUsers } from "./types";

import { useNuxtApp } from "#app";

/** The user service: `current`, `can`/`is`, `login`/`logout`/`refresh`. */
export const useUsers = (): AppUsers => useNuxtApp().$users;
