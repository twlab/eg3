import {
  CopyObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import { ChangeEvent, useState } from "react";
/**
Update-Genome component checks if a genome is already in the aws bucket, and if it is, allow users to update
the genome's information 
 */
function UpdateGenome(props: any) {
  const [uploadDisable, setUploadDisable] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [genomeName, setGenomeName] = useState("");
  const [genomeSpecies, setGenomeSpecies] = useState("");

  const copyAll = async ({
    sourceBucket,
    targetBucket = sourceBucket,
    sourcePrefix,
    targetPrefix,
    concurrency = 5,
    deleteSource = true,
  }: {
    [key: string]: any;
  }) => {
    let ContinuationToken;

    const copyFile = async (sourceKey: string) => {
      const targetKey = sourceKey.replace(sourcePrefix, targetPrefix);
      const command4 = new CopyObjectCommand({
        Bucket: targetBucket,
        Key: targetKey,
        CopySource: `${sourceBucket}/${sourceKey}`,
      });
      const command5 = new DeleteObjectCommand({
        Bucket: sourceBucket,
        Key: sourceKey,
      });
      await props.s3Config.send(command4);

      if (deleteSource) {
        await props.s3Config.send(command5);
      }
    };

    const command3 = new ListObjectsV2Command({
      Bucket: sourceBucket,
      Prefix: sourcePrefix,
      ContinuationToken,
    });
    let isTruncated = true;
    while (isTruncated) {
      const { Contents, IsTruncated, NextContinuationToken } =
        await props.s3Config.send(command3);
      if (Contents) {
        const sourceKeys = Contents!.map(({ Key }: any) => Key);

        await Promise.all(
          new Array(concurrency).fill(null).map(async () => {
            while (sourceKeys.length) {
              await copyFile(sourceKeys.pop()!);
            }
          })
        );
      }

      isTruncated = IsTruncated!;
      command3.input.ContinuationToken = NextContinuationToken;
    }
  };

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
    //sent the files one by one in order to Asynchronously read and cach multiple files else async will cause undefine in array
    let genSpecies = "";
    if (props.allGenome[genomeName]) {
      if (genomeSpecies) {
        genSpecies = genomeSpecies;
      } else {
        genSpecies = props.allGenome[genomeName].species;
      }
      await copyAll({
        sourceBucket: "genomehubs",
        sourcePrefix: props.allGenome[genomeName].species + "/" + genomeName,
        targetPrefix: genSpecies + "/" + genomeName,
      });
      const filePromises = files.map((file: any) =>
        readSingleFile(file, genomeName, genSpecies)
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
          <div>Genome found in database </div>
        ) : (
          <div> Please enter a genome already in the database</div>
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
            disabled={!(genomeName && uploadDisable)}
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

export default UpdateGenome;
