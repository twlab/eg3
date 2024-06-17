import { PutObjectCommand } from "@aws-sdk/client-s3";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import { ChangeEvent, useState } from "react";
/**
Add-Genome component checks if a genome is already in the aws bucket, and if not, allow users to add a 
new genome to aws bucket from the website frontend.
 */
function AddGenome(props: any) {
  const [uploadDisable, setUploadDisable] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [genomeName, setGenomeName] = useState("");
  const [genomeSpecies, setGenomeSpecies] = useState("");
  // Event handler to update the name state
  function handleNameChange(event: any) {
    setGenomeName(event.target.value);
  }

  function handleSpeciesChange(event: any) {
    setGenomeSpecies(event.target.value);
  }

  function handleUploadedFiles(event: ChangeEvent<HTMLInputElement>) {
    var files = event.target.files;
    if (files && files.length) {
      setUploadDisable(true);
      setUploadedFiles((existing) => existing.concat(Array.from(files!)));
    }
  }

  function readSingleFile(file: any, genName: string, genSpecies: string) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const fileName = file.name;
      reader.readAsText(file);
      reader.onload = async () => {
        const command = new PutObjectCommand({
          Bucket: "genomehubs",
          Key: genSpecies + "/" + genName + "/" + fileName,
          Body: reader!.result as string,
        });

        try {
          await props.s3Config.send(command);
        } catch (err) {
          console.error(err);
        }
        resolve(reader!.result);
      };

      reader.onerror = () => {
        reject(new Error("Error reading file."));
      };
    });
  }

  async function readFiles(files: any) {
    if (!props.allGenome[genomeName]) {
      //sent the files one by one in order to Asynchronously read and cach multiple files else async will cause undefine in array
      const filePromises = files.map((file: any) =>
        readSingleFile(file, genomeName, genomeSpecies)
      );
      await Promise.all(filePromises);
      props.addNewGenomeObj();
    }
    setUploadDisable(false);
  }

  return (
    <Container maxWidth="md">
      <div>
        {props.allGenome[genomeName] ? (
          <div>genome already in database</div>
        ) : (
          <div>Please enter a new genome</div>
        )}
        <input
          type="text"
          placeholder="Enter genome name"
          value={genomeName}
          onChange={handleNameChange}
        />
        <input
          type="text"
          placeholder="Enter genome's species"
          value={genomeSpecies}
          onChange={handleSpeciesChange}
        />

        <input
          id="contained-button-file"
          multiple
          type="file"
          onChange={handleUploadedFiles}
        />
        <label htmlFor="contained-button-file">
          <Button
            disabled={!(genomeName && genomeSpecies && uploadDisable)}
            variant="contained"
            onClick={() => readFiles(uploadedFiles)}
          >
            Upload
          </Button>
        </label>
      </div>
    </Container>
  );
}

export default AddGenome;
