/**
 * Triggers a browser download of in-memory text. Used instead of linking to a
 * file under BASE_URL so it also works when the browser is embedded as an npm
 * package, where the hosted public/ folder does not exist.
 */
export function downloadTextFile(
  text: string,
  fileName: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
