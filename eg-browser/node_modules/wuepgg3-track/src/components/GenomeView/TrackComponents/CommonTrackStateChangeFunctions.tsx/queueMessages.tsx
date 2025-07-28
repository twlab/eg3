import { fetchGenomicData } from "../../../../getRemoteData/fetchDataWorker";
const enqueueMessage = (message: Array<any>, messageQueue: any) => {
  messageQueue.current.push(message);
  processQueue();
};
const enqueueGenomeAlignMessage = (
  message: { [key: string]: any },
  genomeAlignMessageQueue: any
) => {
  genomeAlignMessageQueue.current.push(message);

  processGenomeAlignQueue();
};
const processQueue = async (isWorkerBusy: any, messageQueue: any) => {
  if (isWorkerBusy.current) {
    return;
  }
  isWorkerBusy.current = true;

  while (messageQueue.current.length > 0) {
    const messages = messageQueue.current.slice(0); // Create a copy of the current message queue
    messageQueue.current.length = 0; // Clear the message queue

    const results = await Promise.all(
      messages.map((message) => fetchGenomicData(message))
    );

    for (let res of results) {
      processFetchData(res);
    }
  }

  isWorkerBusy.current = false;

  // Check if there are new messages that were added while processing the previous ones
  if (messageQueue.current.length > 0) {
    processQueue(); // Call the processQueue function again if there are new messages
  }
};

const processGenomeAlignQueue = async () => {
  if (isfetchGenomeAlignWorkerBusy.current) {
    return;
  }
  isfetchGenomeAlignWorkerBusy.current = true;

  while (genomeAlignMessageQueue.current.length > 0) {
    const messages = genomeAlignMessageQueue.current.slice(0); // Create a copy of the current message queue
    genomeAlignMessageQueue.current.length = 0; // Clear the message queue

    const results = await Promise.all(
      messages.map((message) => fetchGenomeAlignData(message))
    );

    for (let res of results) {
      processGenomeAlignFetchData(res); // Assuming you have a function to process the fetched data
    }
  }

  isfetchGenomeAlignWorkerBusy.current = false;

  // Check if there are new messages that were added while processing the previous ones
  if (genomeAlignMessageQueue.current.length > 0) {
    processGenomeAlignQueue(); // Call the processGenomeAlignQueue function again if there are new messages
  }
};
