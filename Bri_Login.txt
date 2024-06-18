import {Paper, Grid, Button, Typography, TextField} from "@mui/material";
import { useState } from 'react';
import Api from "../../common/Api";

const Login = (props) => {
  //State variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  return (
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
      <Paper
        style={{ width: '40%' }}
      >
        <Grid
          container
          direction='column'
          spacing={1}
          justifyContent='flex-start'
          alignItems='center'
        >
          <Grid item>
            <Typography variant = 'h4'>Peer Reviewer</Typography>
          </Grid>
          <Grid item style={{ marginBottom: 8 }}>
            <TextField
              variant='outlined'
              label='Email'
              color='white'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Grid>
          <Grid item style={{ marginBottom: 8 }}>
            <TextField
              variant='outlined'
              label='Password'
              color='white'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Grid>
          <Grid item style={{ marginBottom: 8 }}>
            <Button onClick={() => {
              Api.CreateAccount(email, password);
            }}>Create Account</Button>
          </Grid>
          <Grid item>
            <Button
              // Disable Create account button if fields are blank
              disabled={!email || !password}
              onClick={async () => {
                // Check if email and password are valid (they're in the database)
                const results = await Api.Login(email, password);
                if (results.length === 1) {
                  // Set logged in attendee in local storage
                  localStorage.setItem('LoggedInAttendee', JSON.stringify(results[0]));
                  // Re-direct to home page
                  window.location.href = '/';
                }
                else {
                  // Reject incorrect email and passwrod
                  setLoginError(true);
                }
              }}
            >Login</Button>
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
};

export default Login;