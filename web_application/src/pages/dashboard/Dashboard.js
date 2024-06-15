import {Grid} from "@mui/material";
import { useEffect } from "react";

const Dashboard = (props) => {
  // TODO: set up state hooks here

  useEffect(() => {
    // TODO: page population API calls go here 
  }, []);

  return (
      <Grid
        container
        direction='column'
        spacing={1}
        justifyContent='flex-start'
        alignItems='center'
        style={{ marginLeft: -8 }}
      >
        <Grid item>
          This is the main page!
        </Grid>
      </Grid>
  );
};

export default Dashboard;