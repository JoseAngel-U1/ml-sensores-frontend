// Exclusión mutua compartida por sincronización y eliminación, también al navegar.
let ocupado = false;
const observadores = new Set<() => void>();

export function hayOperacionRegistros(): boolean {
  return ocupado;
}

export function observarOperacionesRegistros(observador: () => void): () => void {
  observadores.add(observador);
  return () => { observadores.delete(observador); };
}

export async function conBloqueoRegistros<T>(operacion: () => Promise<T>): Promise<T> {
  if (ocupado) throw new Error("Hay una operación de registros en curso. Espera a que termine.");
  ocupado = true;
  observadores.forEach((observar) => observar());
  try {
    return await operacion();
  } finally {
    ocupado = false;
    observadores.forEach((observar) => observar());
  }
}
