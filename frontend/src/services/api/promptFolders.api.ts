// ---------------------------------------------------------------------------
// services/api/promptFolders.api.ts  --  Prompt folder CRUD
// ---------------------------------------------------------------------------
import client from "./client";
import type {
  PromptFolder,
  PromptFolderCreate,
  PromptFolderUpdate,
} from "@/types";

/** GET /prompt-folders */
export async function getPromptFolders(): Promise<PromptFolder[]> {
  const { data } = await client.get<PromptFolder[]>("/prompt-folders");
  return data;
}

/** POST /prompt-folders */
export async function createPromptFolder(
  payload: PromptFolderCreate,
): Promise<PromptFolder> {
  const { data } = await client.post<PromptFolder>("/prompt-folders", payload);
  return data;
}

/** PATCH /prompt-folders/:id */
export async function updatePromptFolder(
  id: number,
  payload: PromptFolderUpdate,
): Promise<PromptFolder> {
  const { data } = await client.patch<PromptFolder>(
    `/prompt-folders/${id}`,
    payload,
  );
  return data;
}

/** DELETE /prompt-folders/:id */
export async function deletePromptFolder(id: number): Promise<void> {
  await client.delete(`/prompt-folders/${id}`);
}
