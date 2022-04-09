import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

export function Home() {
  return (
    <div className="home-page">
      <h1>Home</h1>
      <p>Greetings!</p>
      <Box
        component="form"
        sx={{
            '& > :not(style)': { m: 1, width: '25ch' },
        }}
        noValidate
        autoComplete="off"
      >
        <TextField id="outlined-basic" label="Outlined" variant="outlined" />
        <TextField id="filled-basic" label="Filled" variant="filled" />
        <TextField id="standard-basic" label="Standard" variant="standard" />
      </Box>
    </div>
  );
}
