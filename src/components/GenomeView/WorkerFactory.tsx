const workers: Array<Record<string, any>> = [];
const promises: Promise<any>[] = [];
export function createWorker(data: any): Worker {
  const worker = new Worker(
    new URL("./getRemoteData/tabixSourceWorker.ts", import.meta.url),
    {
      type: "module",
    }
  );

  // Initialize the worker with data (if needed)
  worker.postMessage({ records: data });

  return worker;
}
function getAvailableWorker(data) {
  // Check if any workers are available
  const availableWorker = workers.find((worker) => !workers["inUse"]); // You'll need to track this flag

  if (availableWorker) {
    console.log("YOASDASD");
    availableWorker["inUse"] = true; // Mark it as in use
    availableWorker["worker"].postMessage({ records: data });
  } else {
    // Create a new worker if none are available
    const newWorker = createWorker(data);
    let tmpObj = { worker: newWorker, inUse: true };
    workers.push(tmpObj);
  }
}
export function handleData(dataArray: any[]): Promise<any[]> {
  getAvailableWorker(dataArray);

  handleSmallerData(dataArray);

  workers.forEach((worker) => {
    const workerPromise = new Promise((resolve) => {
      worker["worker"].addEventListener("message", (event) => {
        resolve(event.data); // Resolve the promise with the worker's result
      });
    });
    worker["inUse"] = false;
    promises.push(workerPromise);
  });

  return Promise.all(promises);
}

export function handleSmallerData(dataArray: any[]): void {
  // Remove excess workers
  while (workers.length > dataArray.length) {
    const workerToRemove = workers.shift();
    workerToRemove!.terminate(); // Clean up the worker
  }
}
