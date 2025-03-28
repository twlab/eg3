class BrowserLocalFile {
  file: any;

  constructor(blob) {
    this.file = blob;
  }

  async read(position, length) {
    const file = this.file;

    return new Promise(function (fullfill, reject) {
      const fileReader = new FileReader();

      fileReader.onload = function (e) {
        fullfill(fileReader.result);
      };

      fileReader.onerror = function (e) {
        console.log("Error reading local file " + file.name);
        reject(fileReader);
      };

      if (position !== undefined) {
        const blob = file.slice(position, position + length);
        fileReader.readAsArrayBuffer(blob);
      } else {
        fileReader.readAsArrayBuffer(file);
      }
    });
  }
}

export default BrowserLocalFile;
