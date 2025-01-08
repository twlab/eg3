import {
  Container,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardMedia,
  List,
  ListItem,
  ListItemText,
  Box,
  ListItemButton,
  Button,
} from "@mui/material";
import { useState } from "react";
import { Link } from "react-router-dom";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Logo from "../images/logo.png";
import "./GenomePicker.css";
/**
 * loading page for choose genome
 * @author Daofeng Li
 * @author Shane Liu
 */
function GenomePicker(props: any) {
  const [searchText, setSearchText] = useState("");
  // Map the genomes to a list of cards. Genome search engine filters by both the species and the different assemblies.
  // It is not case sensitive.
  const [selectedIndex, setSelectedIndex] = useState(1);

  return (
    <Container maxWidth="md">
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          {!props.selectedGenome.length ? (
            <Typography variant="h4" style={{ margin: "25px", marginLeft: 0 }}>
              {"Please select a genome"}
            </Typography>
          ) : props.selectedGenome.length === 3 ? (
            <Typography variant="h4" style={{ margin: "25px", marginLeft: 0 }}>
              {"You can only select 3 genomes"}
            </Typography>
          ) : (
            <Typography variant="h4" style={{ margin: "25px", marginLeft: 0 }}>
              {"Selected Genomes"}
            </Typography>
          )}
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            id="outlined-margin-normal"
            placeholder="Search for a genome..."
            margin="normal"
            variant="outlined"
            style={{ width: "100%", paddingRight: "16px" }}
            className="searchFieldRounded"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">{"+"}</InputAdornment>
              ),
            }}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Grid>
      </Grid>
      <Box>
        <Grid container spacing={0.5} item xs={12}>
          {props.selectedGenome.map((genomeItem: any, key: number) => {
            return (
              <Grid item key={key}>
                <Card>
                  <ListItem>{genomeItem.genome.getName()}</ListItem>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
      <Button
        component={Link}
        to="/genome"
        variant="contained"
        color="primary"
        endIcon={<ArrowForwardIosIcon />}
      ></Button>

      <Grid container spacing={2}>
        {Object.entries(props.treeOfLife)
          .filter((entry: any) => {
            return (
              entry[0].toLowerCase().includes(searchText.toLowerCase()) ||
              entry[1].assemblies
                .join("")
                .toLowerCase()
                .includes(searchText.toLowerCase())
            );
          })
          .map((entry: any, idx) => {
            let filteredAssemblies = entry[1].assemblies;
            if (!entry[0].toLowerCase().includes(searchText.toLowerCase())) {
              filteredAssemblies = entry[1].assemblies.filter((e: string) =>
                e.toLowerCase().includes(searchText.toLowerCase())
              );
            }
            return (
              // @ts-ignore
              <Grid item xs={12} md={4} align="center" key={idx}>
                <Card>
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="h2">
                      <CardMedia
                        image={entry[1].logoUrl}
                        title={entry[0]}
                        style={{ height: 60 }}
                      />
                      {entry[0]}
                    </Typography>
                    <List>
                      {filteredAssemblies?.map((gene: any, idx: number) => {
                        return (
                          <ListItem
                            key={idx}
                            onClick={() =>
                              props.addToView(
                                props.allGenome ? props.allGenome[gene] : gene
                              )
                            }
                            style={{ height: 30 }}
                          >
                            <ListItemButton
                              selected={selectedIndex === 0}
                              onClick={() => setSelectedIndex(0)}
                              style={{
                                maxHeight: "25px",
                                minHeight: "30px",
                              }}
                            >
                              <ListItemText primary={"- " + gene} />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
      </Grid>
    </Container>
  );
}

export default GenomePicker;
