import {Grid} from "@mui/material";
import { useEffect } from "react";

const Review = (props) => {
  // TODO: set up state hooks here

  useEffect(() => {
    // TODO: API calls go here
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
          Hello World 1
        </Grid>
        <Grid item>
          Hello World 2
        </Grid>
      </Grid>
  );
};

export default Review;