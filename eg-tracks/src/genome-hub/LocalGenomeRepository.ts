import { IGenome, IGenomeHubSource } from "../types/genome-hub";

export default class LocalGenomeRepository implements IGenomeHubSource {
    private static readonly DB_NAME = "_eg-genome-hub";
    private static readonly STORE_NAME = "genomes";
    private static readonly DB_VERSION = 1;

    private dbPromise: Promise<IDBDatabase> | null = null;

    private getDB(): Promise<IDBDatabase> {
        if (!this.dbPromise) {
            this.dbPromise = new Promise((resolve, reject) => {
                const request = indexedDB.open(LocalGenomeRepository.DB_NAME, LocalGenomeRepository.DB_VERSION);

                request.onupgradeneeded = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    if (!db.objectStoreNames.contains(LocalGenomeRepository.STORE_NAME)) {
                        db.createObjectStore(LocalGenomeRepository.STORE_NAME, { keyPath: "id" });
                    }
                };

                request.onsuccess = () => {
                    request.result.onclose = () => {
                        this.dbPromise = null;
                    };

                    request.result.onversionchange = () => {
                        request.result.close();
                        this.dbPromise = null;
                    };

                    resolve(request.result);
                };

                request.onerror = () => reject(request.error);
            });
        }

        return this.dbPromise;
    }

    async closeDB(): Promise<void> {
        if (this.dbPromise) {
            const db = await this.dbPromise;
            db.close();
            this.dbPromise = null;
        }
    }

    async listGenomes(): Promise<IGenome[]> {
        const db = await this.getDB();

        return new Promise<IGenome[]>((resolve, reject) => {
            const transaction = db.transaction(LocalGenomeRepository.STORE_NAME, "readonly");
            const store = transaction.objectStore(LocalGenomeRepository.STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async getGenomeById(id: uuid): Promise<IGenome> {
        const db = await this.getDB();

        return new Promise<IGenome>((resolve, reject) => {
            const transaction = db.transaction(LocalGenomeRepository.STORE_NAME, "readonly");
            const store = transaction.objectStore(LocalGenomeRepository.STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => {
                if (request.result) {
                    resolve(request.result);
                } else {
                    reject(new Error(`Genome with id ${id} not found`));
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    async putGenome(genome: IGenome): Promise<uuid> {
        const db = await this.getDB();

        return new Promise<uuid>((resolve, reject) => {
            const transaction = db.transaction(LocalGenomeRepository.STORE_NAME, "readwrite");
            const store = transaction.objectStore(LocalGenomeRepository.STORE_NAME);
            const request = store.put(genome);

            request.onsuccess = () => resolve(genome.id);
            request.onerror = () => reject(request.error);
        });
    }
}

type uuid = string;
