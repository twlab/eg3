import { Box, AppBar, Tabs, Tab } from "@mui/material";
import React, { ChangeEvent } from "react";
import UpdateGenome from "./UpdateGenome";
import GenomePicker from "./GenomePicker";
import AddGenome from "./AddGenome";

import SessionUI from "./SessionUI";
/**
 * The Homepage root component. This is where the tab components Add-Genome, Genome-Picker,
 *  and Update-Genome are gathered and structurally organized to be displayed
 */
function Homepage(props: any) {
  const [value, setValue] = React.useState(0);

  interface TabPanelProps {
    children: React.ReactNode;
    index: number;
    value: any;
    [key: string]: any;
  }

  function a11yProps(index: number) {
    return {
      id: `full-width-tab-${index}`,
      "aria-controls": `full-width-tabpanel-${index}`,
    };
  }

  function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`full-width-tabpanel-${index}`}
        aria-labelledby={`full-width-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  }

  function handleTabChange(_event: ChangeEvent<{}>, newValue: any) {
    setValue(newValue);
  }
  const handleChangeIndex = (index: number) => {
    setValue(index);
  };

  return (
    <div>
      <AppBar position="static" color="default">
        <Tabs
          value={value}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          aria-label="genome picker"
        >
          <Tab label="Choose a Genome" {...a11yProps(0)} />
          <Tab label="Load a session" {...a11yProps(1)} />
          {/* <Tab label="Update a genome" {...a11yProps(2)} />
          <Tab label="Add a genome" {...a11yProps(3)} /> */}
        </Tabs>

        <TabPanel value={value} index={0}>
          <GenomePicker
            addToView={props.addToView}
            allGenome={props.allGenome}
            treeOfLife={props.treeOfLife}
            selectedGenome={props.selectedGenome}
          />
        </TabPanel>
        <TabPanel value={value} index={1} dir={"x"}>
          <SessionUI
            bundleId={"1234"}
            withGenomePicker={true}
            onRestoreSession={function (session: object): void {
              throw new Error("Function not implemented.");
            }}
            onRetrieveBundle={function (id: string): void {
              throw new Error("Function not implemented.");
            }}
            addSessionState={undefined}
          />
        </TabPanel>

        {/* <TabPanel value={value} index={2}>
          <UpdateGenome
            allGenome={props.allGenome}
            s3Config={props.s3Config}
            addNewGenomeObj={props.addNewGenomeObj}
          />
        </TabPanel>
        <TabPanel value={value} index={3}>
          <AddGenome
            allGenome={props.allGenome}
            s3Config={props.s3Config}
            addNewGenomeObj={props.addNewGenomeObj}
          />
        </TabPanel> */}
      </AppBar>
    </div>
  );
}

export default Homepage;
